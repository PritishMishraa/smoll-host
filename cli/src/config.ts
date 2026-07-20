import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface SmollConfig {
	apiUrl?: string;
	token?: string;
}

export function getConfigPath(env: NodeJS.ProcessEnv = process.env) {
	const configRoot =
		env.SMOLL_CONFIG_DIR ??
		env.XDG_CONFIG_HOME ??
		join(env.HOME ?? homedir(), ".config");

	return join(configRoot, "smoll", "config.json");
}

export async function loadConfig(env: NodeJS.ProcessEnv = process.env): Promise<SmollConfig> {
	try {
		const contents = await readFile(getConfigPath(env), "utf8");
		const parsed = JSON.parse(contents) as SmollConfig;

		return typeof parsed === "object" && parsed ? parsed : {};
	} catch (error) {
		const code = error instanceof Error && "code" in error ? error.code : undefined;

		if (code === "ENOENT") {
			return {};
		}

		throw new Error(`Could not read the smoll config: ${getErrorMessage(error)}`);
	}
}

export async function saveConfig(config: SmollConfig, env: NodeJS.ProcessEnv = process.env) {
	const path = getConfigPath(env);
	await mkdir(dirname(path), { recursive: true, mode: 0o700 });
	await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, {
		encoding: "utf8",
		mode: 0o600,
	});
	await chmod(path, 0o600);

	return path;
}

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}
