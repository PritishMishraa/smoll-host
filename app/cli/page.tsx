import { Metadata } from "next";
import { Link } from "@nextui-org/link";

import { ApiKeyGate } from "@/components/api-key-gate";
import { CopyButton } from "@/components/copy-button";
import { subtitle, title } from "@/components/primitives";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
	title: "CLI & agents",
	description:
		"Create API keys, install the smoll CLI, and let your AI agents publish HTML pages.",
};

const APP_ORIGIN = "https://smoll-host.vercel.app";
const INSTALL_COMMAND = `curl -fsSL ${APP_ORIGIN}/install.sh | bash`;
const SET_TOKEN_COMMAND = 'smoll auth set-token "smoll_..."';
const DEPLOY_COMMAND = "smoll deploy ./index.html --site my-docs";

const AGENT_PROMPT = `You can publish self-contained HTML pages to smoll.host with the \`smoll\` CLI. My API key is in the SMOLL_HOST_TOKEN environment variable.

Deploy:
- Run: smoll deploy <file.html> --site <subdomain> --json
- The file must be one self-contained .html document (all CSS and JS inline), max 16 MB.
- Subdomains are 3-30 characters: lowercase letters, numbers, and hyphens. If the name is taken, pick another one and retry.
- Always pass --json, parse stdout as JSON, and check the exit code: 0 means success, 3 means authentication failed (tell me if the token is missing or rejected).

Careful:
- Re-deploying the same --site overwrites the live page. Check what exists first with \`smoll sites list --json\` and ask me before overwriting.
- Only run \`smoll sites delete\` when I explicitly ask.

When a deploy succeeds, reply with the site.url from the JSON output.`;

export default function CliPage() {
	return (
		<section className="mx-auto flex w-full max-w-2xl flex-col gap-10 py-8 md:py-12">
			<div className="flex flex-col items-center gap-3 text-center">
				<h1 className={title({ color: "violet" })}>CLI &amp; agents</h1>
				<h2 className={subtitle({ class: "mt-0 text-default-500" })}>
					Publish HTML from your terminal, CI, or an AI agent.
				</h2>
			</div>

			<ol className="flex flex-col gap-8">
				<Step number={1} heading="Create an API key">
					<p className="text-sm text-default-500">
						Keys are shown once, expire after 90 days, and can only manage your own sites.
					</p>
					<ApiKeyGate />
				</Step>

				<Step number={2} heading="Install the CLI">
					<p className="text-sm text-default-500">
						Requires Node.js 20 or newer. The installer builds the CLI from source and
						installs it globally:
					</p>
					<CodeBlock code={INSTALL_COMMAND} toastMessage="Install command copied" />
					<p className="text-xs text-default-400">
						Prefer to inspect it first? Read{" "}
						<Link isExternal className="text-xs" href={`${APP_ORIGIN}/install.sh`}>
							the script
						</Link>{" "}
						or{" "}
						<Link
							isExternal
							className="text-xs"
							href={`${siteConfig.links.github}/blob/main/CLI.md`}
						>
							build from source
						</Link>
						.
					</p>
				</Step>

				<Step number={3} heading="Connect the CLI">
					<p className="text-sm text-default-500">
						Paste the key you created above. It is stored with owner-only permissions in
						your config directory:
					</p>
					<CodeBlock code={SET_TOKEN_COMMAND} toastMessage="Command copied" />
					<p className="text-xs text-default-400">
						For agents and CI, prefer the environment:{" "}
						<code className="rounded bg-default-100 px-1 py-0.5">
							export SMOLL_HOST_TOKEN=&quot;smoll_...&quot;
						</code>
					</p>
				</Step>

				<Step number={4} heading="Deploy your first page">
					<CodeBlock code={DEPLOY_COMMAND} toastMessage="Command copied" />
					<p className="text-sm text-default-500">
						Your page goes live at{" "}
						<code className="rounded bg-default-100 px-1 py-0.5">
							https://my-docs.{siteConfig.publicHost}
						</code>
						. Add{" "}
						<code className="rounded bg-default-100 px-1 py-0.5">--json</code> for stable,
						machine-readable output.
					</p>
				</Step>
			</ol>

			<section aria-labelledby="agent-prompt-heading" className="flex flex-col gap-3">
				<div>
					<p className="text-xs font-medium uppercase tracking-widest text-default-500">
						Hand it to your agent
					</p>
					<h2 id="agent-prompt-heading" className="text-xl font-semibold text-foreground">
						A prompt that works
					</h2>
					<p className="mt-1 text-sm text-default-500">
						Paste this into your coding agent (Claude Code, Cursor, etc.) after setting{" "}
						<code className="rounded bg-default-100 px-1 py-0.5">SMOLL_HOST_TOKEN</code> in
						its environment.
					</p>
				</div>
				<div className="rounded-xl border border-default-200 bg-default-50/40">
					<div className="flex items-center justify-between border-b border-default-200 px-4 py-2">
						<p className="text-xs font-medium text-default-500">agent prompt</p>
						<CopyButton text={AGENT_PROMPT} toastMessage="Prompt copied" />
					</div>
					<pre className="overflow-x-auto whitespace-pre-wrap px-4 py-3 font-mono text-xs leading-relaxed text-default-700">
						{AGENT_PROMPT}
					</pre>
				</div>
			</section>

			<p className="text-center text-xs text-default-400">
				Full reference:{" "}
				<Link
					isExternal
					className="text-xs"
					href={`${siteConfig.links.github}/blob/main/CLI.md`}
				>
					CLI.md
				</Link>{" "}
				·{" "}
				<Link isExternal className="text-xs" href="/openapi.json">
					API contract (openapi.json)
				</Link>
			</p>
		</section>
	);
}

function Step({
	number,
	heading,
	children,
}: {
	number: number;
	heading: string;
	children: React.ReactNode;
}) {
	return (
		<li className="flex gap-4">
			<span
				aria-hidden="true"
				className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-sm font-semibold text-secondary"
			>
				{number}
			</span>
			<div className="flex min-w-0 flex-1 flex-col gap-3">
				<h2 className="text-lg font-semibold leading-7 text-foreground">{heading}</h2>
				{children}
			</div>
		</li>
	);
}

function CodeBlock({ code, toastMessage }: { code: string; toastMessage: string }) {
	return (
		<div className="flex items-center gap-2 rounded-lg border border-default-200 bg-default-50/40 py-2 pl-4 pr-2">
			<code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-xs sm:text-sm">
				{code}
			</code>
			<CopyButton text={code} toastMessage={toastMessage} />
		</div>
	);
}
