"use client";

import { Button } from "@nextui-org/button";

import { GithubIcon } from "@/components/icons";
import { authClient } from "@/lib/auth-client";

export function AuthButton() {
	const { data: session, isPending } = authClient.useSession();
	const user = session?.user;
	const displayName = user?.name ?? user?.email ?? "Account";
	const avatarInitial = displayName.charAt(0).toUpperCase();

	if (user) {
		return (
			<Button
				className="h-10 border border-default-200/50 bg-background/35 px-1.5 text-sm font-normal text-foreground shadow-sm shadow-background/10 backdrop-blur-md hover:bg-background/55"
				isDisabled={isPending}
				radius="full"
				variant="flat"
				onPress={() => authClient.signOut()}
			>
				<span className="flex min-w-0 items-center gap-2">
					<span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary/15 text-xs font-semibold text-secondary ring-1 ring-secondary/25">
						{user.image ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								alt=""
								className="size-full object-cover"
								src={user.image}
							/>
						) : (
							avatarInitial
						)}
					</span>
					<span className="hidden max-w-28 truncate text-default-700 sm:inline">{displayName}</span>
					<span className="rounded-full bg-default-100/70 px-2 py-1 text-xs text-default-500">
						Logout
					</span>
				</span>
			</Button>
		);
	}

	return (
		<Button
			className="border border-default-200/50 bg-background/35 text-sm font-normal text-foreground backdrop-blur-md hover:bg-background/55"
			isLoading={isPending}
			radius="full"
			startContent={!isPending ? <GithubIcon size={20} /> : null}
			variant="flat"
			onPress={() => authClient.signIn.social({ provider: "github" })}
		>
			Sign in
		</Button>
	);
}
