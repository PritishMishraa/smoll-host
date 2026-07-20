import { access, readFile, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

import { SmollApiClient, SmollApiError } from "./client.js";
import { loadConfig, saveConfig } from "./config.js";

const DEFAULT_API_URL = "https://smoll.host";
const MAX_HTML_BYTES = 16 * 1024 * 1024;

export interface CliIo {
	env: NodeJS.ProcessEnv;
	stdout(message: string): void;
	stderr(message: string): void;
	readStdin(): Promise<Uint8Array>;
	stdinIsTTY?: boolean;
	fetchImpl?: typeof fetch;
}

export const defaultIo: CliIo = {
	env: process.env,
	stdout: (message) => process.stdout.write(message),
	stderr: (message) => process.stderr.write(message),
	stdinIsTTY: process.stdin.isTTY,
	readStdin: async () => {
		const chunks: Buffer[] = [];

		for await (const chunk of process.stdin) {
			chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
		}

		return new Uint8Array(Buffer.concat(chunks));
	},
};

export async function runCli(argv: string[], io: CliIo = defaultIo): Promise<number> {
	const parsed = parseArgs(argv);

	if (parsed.flags.version) {
		io.stdout("0.1.0\n");
		return 0;
	}

	if (parsed.flags.help || parsed.positionals.length === 0) {
		io.stdout(helpText());
		return 0;
	}

	try {
		const [command, subcommand, ...rest] = parsed.positionals;

		if (command === "auth") {
			return await runAuth(subcommand, rest, parsed.flags, io);
		}

		const config = await loadConfig(io.env);
		const token = parsed.flags.token ?? io.env.SMOLL_HOST_TOKEN ?? config.token;
		const apiUrl =
			parsed.flags.apiUrl ??
			io.env.SMOLL_HOST_API_URL ??
			config.apiUrl ??
			DEFAULT_API_URL;

		if (!token) {
			throw new CliError(
				"AUTH_REQUIRED",
				"Set SMOLL_HOST_TOKEN or run `smoll auth set-token <token>`.",
				3
			);
		}

		const client = new SmollApiClient(apiUrl, token, io.fetchImpl);

		if (command === "deploy") {
			return await deploy(subcommand, parsed.flags, client, io);
		}

		if (command === "sites" && subcommand === "list") {
			return await listSites(client, parsed.flags.json, io);
		}

		if (command === "sites" && subcommand === "download") {
			return await downloadSite(rest[0], parsed.flags, client, io);
		}

		if (command === "sites" && subcommand === "delete") {
			return await deleteSite(rest[0], parsed.flags, client, io);
		}

		throw new CliError("USAGE_ERROR", `Unknown command: ${[command, subcommand].filter(Boolean).join(" ")}`, 2);
	} catch (error) {
		return reportError(error, parsed.flags.json, io);
	}
}

async function deploy(
	path: string | undefined,
	flags: ParsedFlags,
	client: SmollApiClient,
	io: CliIo
) {
	if (!path || !flags.site) {
		throw new CliError("USAGE_ERROR", "Usage: smoll deploy <file|-> --site <name>", 2);
	}

	const html = path === "-" ? await io.readStdin() : await readHtmlFile(path);
	validateHtml(html, path);
	const result = await client.publish(flags.site, html);

	if (flags.json) {
		io.stdout(`${JSON.stringify(result)}\n`);
	} else {
		io.stdout(`${result.created ? "Created" : "Updated"} ${result.site.url}\n`);
		io.stdout(`${result.bytes} bytes · sha256:${result.sha256.slice(0, 12)}\n`);
	}

	return 0;
}

async function listSites(client: SmollApiClient, json: boolean, io: CliIo) {
	const result = await client.listSites();

	if (json) {
		io.stdout(`${JSON.stringify(result)}\n`);
	} else if (result.sites.length === 0) {
		io.stdout("No sites found.\n");
	} else {
		for (const site of result.sites) {
			io.stdout(`${site.name}\t${site.url}\t${site.publishedAt ?? "unpublished"}\n`);
		}
	}

	return 0;
}

async function downloadSite(
	site: string | undefined,
	flags: ParsedFlags,
	client: SmollApiClient,
	io: CliIo
) {
	if (!site) {
		throw new CliError("USAGE_ERROR", "Usage: smoll sites download <site> [--output file]", 2);
	}

	const output = resolve(flags.output ?? `${site}.html`);

	if (!flags.force && (await exists(output))) {
		throw new CliError(
			"OUTPUT_EXISTS",
			`${output} already exists. Pass --force to replace it.`,
			2
		);
	}

	const html = await client.download(site);
	await writeFile(output, html);

	if (flags.json) {
		io.stdout(`${JSON.stringify({ ok: true, site, output, bytes: html.byteLength })}\n`);
	} else {
		io.stdout(`Downloaded ${site} to ${output}\n`);
	}

	return 0;
}

async function deleteSite(
	site: string | undefined,
	flags: ParsedFlags,
	client: SmollApiClient,
	io: CliIo
) {
	if (!site || !flags.yes) {
		throw new CliError(
			"CONFIRMATION_REQUIRED",
			"Usage: smoll sites delete <site> --yes",
			2
		);
	}

	const result = await client.deleteSite(site);

	if (flags.json) {
		io.stdout(`${JSON.stringify(result)}\n`);
	} else {
		io.stdout(`Deleted ${site}\n`);
	}

	return 0;
}

async function runAuth(
	subcommand: string | undefined,
	rest: string[],
	flags: ParsedFlags,
	io: CliIo
) {
	if (subcommand === "set-token") {
		if (!rest[0] && io.stdinIsTTY) {
			throw new CliError(
				"USAGE_ERROR",
				"Pass the token as an argument or pipe it over stdin.",
				2
			);
		}

		const stdinToken = rest[0] ? undefined : Buffer.from(await io.readStdin()).toString("utf8");
		const token = (rest[0] ?? stdinToken ?? "").trim();

		if (!token.startsWith("smoll_") || token.length < 32) {
			throw new CliError("INVALID_TOKEN", "Expected a smoll_ API key.", 2);
		}

		const current = await loadConfig(io.env);
		const path = await saveConfig(
			{
				...current,
				apiUrl: flags.apiUrl ?? current.apiUrl,
				token,
			},
			io.env
		);

		if (flags.json) {
			io.stdout(`${JSON.stringify({ ok: true, configPath: path })}\n`);
		} else {
			io.stdout(`Saved API key to ${path}\n`);
		}

		return 0;
	}

	if (subcommand === "status") {
		const config = await loadConfig(io.env);
		const source = io.env.SMOLL_HOST_TOKEN ? "environment" : config.token ? "config" : null;
		const result = {
			ok: Boolean(source),
			authenticated: Boolean(source),
			source,
			apiUrl:
				flags.apiUrl ??
				io.env.SMOLL_HOST_API_URL ??
				config.apiUrl ??
				DEFAULT_API_URL,
		};

		if (flags.json) {
			io.stdout(`${JSON.stringify(result)}\n`);
		} else {
			io.stdout(source ? `API key configured via ${source}.\n` : "No API key configured.\n");
			io.stdout(`API: ${result.apiUrl}\n`);
		}

		return source ? 0 : 3;
	}

	throw new CliError(
		"USAGE_ERROR",
		"Usage: smoll auth set-token <token> | smoll auth status",
		2
	);
}

interface ParsedFlags {
	apiUrl?: string;
	force: boolean;
	help: boolean;
	json: boolean;
	output?: string;
	site?: string;
	token?: string;
	version: boolean;
	yes: boolean;
}

export function parseArgs(argv: string[]) {
	const flags: ParsedFlags = {
		force: false,
		help: false,
		json: false,
		version: false,
		yes: false,
	};
	const positionals: string[] = [];

	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];

		if (argument === "-" || !argument.startsWith("-")) {
			positionals.push(argument);
			continue;
		}

		if (argument === "--json") flags.json = true;
		else if (argument === "--yes") flags.yes = true;
		else if (argument === "--force") flags.force = true;
		else if (argument === "--help" || argument === "-h") flags.help = true;
		else if (argument === "--version" || argument === "-v") flags.version = true;
		else if (argument === "--site") flags.site = requireFlagValue(argv, ++index, "--site");
		else if (argument.startsWith("--site=")) flags.site = argument.slice("--site=".length);
		else if (argument === "--output" || argument === "-o") flags.output = requireFlagValue(argv, ++index, argument);
		else if (argument.startsWith("--output=")) flags.output = argument.slice("--output=".length);
		else if (argument === "--api-url") flags.apiUrl = requireFlagValue(argv, ++index, "--api-url");
		else if (argument.startsWith("--api-url=")) flags.apiUrl = argument.slice("--api-url=".length);
		else if (argument === "--token") flags.token = requireFlagValue(argv, ++index, "--token");
		else throw new CliError("USAGE_ERROR", `Unknown option: ${argument}`, 2);
	}

	return { flags, positionals };
}

function requireFlagValue(argv: string[], index: number, flag: string) {
	const value = argv[index];

	if (!value || value.startsWith("--")) {
		throw new CliError("USAGE_ERROR", `${flag} requires a value`, 2);
	}

	return value;
}

async function readHtmlFile(path: string) {
	const extension = extname(path).toLowerCase();

	if (extension !== ".html" && extension !== ".htm") {
		throw new CliError("INVALID_HTML_FILE", "The upload must be a .html or .htm file.", 2);
	}

	try {
		return new Uint8Array(await readFile(resolve(path)));
	} catch (error) {
		throw new CliError(
			"FILE_READ_ERROR",
			error instanceof Error ? error.message : "Could not read the HTML file",
			2
		);
	}
}

function validateHtml(html: Uint8Array, source: string) {
	if (html.byteLength === 0) {
		throw new CliError("EMPTY_HTML", `${source} is empty.`, 2);
	}

	if (html.byteLength > MAX_HTML_BYTES) {
		throw new CliError("HTML_TOO_LARGE", "The HTML document must be 16 MB or smaller.", 2);
	}
}

async function exists(path: string) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

function reportError(error: unknown, json: boolean, io: CliIo) {
	const known =
		error instanceof SmollApiError
			? {
					code: error.code,
					message: error.message,
					requestId: error.requestId,
					exitCode: error.status === 401 || error.status === 403 ? 3 : 1,
				}
			: error instanceof CliError
				? {
						code: error.code,
						message: error.message,
						requestId: undefined,
						exitCode: error.exitCode,
					}
				: {
						code: "UNEXPECTED_ERROR",
						message: error instanceof Error ? error.message : String(error),
						requestId: undefined,
						exitCode: 1,
					};

	if (json) {
		io.stderr(
			`${JSON.stringify({
				ok: false,
				error: {
					code: known.code,
					message: known.message,
					...(known.requestId ? { requestId: known.requestId } : {}),
				},
			})}\n`
		);
	} else {
		io.stderr(`Error [${known.code}]: ${known.message}\n`);
		if (known.requestId) {
			io.stderr(`Request ID: ${known.requestId}\n`);
		}
	}

	return known.exitCode;
}

class CliError extends Error {
	constructor(
		public readonly code: string,
		message: string,
		public readonly exitCode: number
	) {
		super(message);
		this.name = "CliError";
	}
}

function helpText() {
	return `smoll — publish self-contained HTML documents

Usage:
  smoll deploy <file|-> --site <name> [--json]
  smoll sites list [--json]
  smoll sites download <site> [--output file] [--force]
  smoll sites delete <site> --yes [--json]
  smoll auth set-token <token>
  smoll auth status [--json]

Environment:
  SMOLL_HOST_TOKEN     API key generated in the smoll.host dashboard
  SMOLL_HOST_API_URL   API origin (default: https://smoll.host)
  SMOLL_CONFIG_DIR     Override the local config directory
`;
}
