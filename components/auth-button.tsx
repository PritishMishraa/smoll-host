"use client";

import { Button } from "@nextui-org/button";

import { GithubIcon } from "@/components/icons";
import { authClient } from "@/lib/auth-client";

export function AuthButton() {
	const { data: session, isPending } = authClient.useSession();

	if (session?.user) {
		return (
			<Button
				className="text-sm font-normal text-default-600 bg-default-100"
				isDisabled={isPending}
				variant="flat"
				onPress={() => authClient.signOut()}
			>
				Sign out
			</Button>
		);
	}

	return (
		<Button
			className="text-sm font-normal text-default-600 bg-default-100"
			isLoading={isPending}
			startContent={!isPending ? <GithubIcon size={20} /> : null}
			variant="flat"
			onPress={() => authClient.signIn.social({ provider: "github" })}
		>
			Sign in
		</Button>
	);
}
