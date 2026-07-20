"use client";

import { Button } from "@nextui-org/button";

import { ApiKeyManager } from "@/components/api-key-manager";
import { GithubIcon } from "@/components/icons";
import { authClient } from "@/lib/auth-client";

/**
 * Shows the API key manager when signed in, and a sign-in prompt otherwise.
 * Used on the /cli page, where creating a key is the main call to action.
 */
export function ApiKeyGate() {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return (
			<div
				className="flex h-28 items-center justify-center rounded-xl border border-default-200 bg-default-50/40"
				role="status"
				aria-label="Checking your session"
			>
				<p className="animate-pulse text-sm text-default-500">Checking your session…</p>
			</div>
		);
	}

	if (!session?.user) {
		return (
			<div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-default-200 bg-default-50/40 px-6 py-10 text-center">
				<div>
					<p className="text-base font-medium text-foreground">Sign in to create API keys</p>
					<p className="mt-1 max-w-sm text-sm text-default-500">
						API keys let the CLI, CI jobs, and AI agents publish to your sites.
						They expire after 90 days and can be revoked at any time.
					</p>
				</div>
				<Button
					color="secondary"
					startContent={<GithubIcon size={18} />}
					onPress={() => authClient.signIn.social({ provider: "github" })}
				>
					Sign in with GitHub
				</Button>
			</div>
		);
	}

	return <ApiKeyManager className="mt-0" />;
}
