"use client";

import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import * as React from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

interface ManagedApiKey {
	id: string;
	name: string | null;
	start: string | null;
	createdAt: Date | string;
	expiresAt: Date | string | null;
	lastRequest: Date | string | null;
}

export function ApiKeyManager() {
	const { data: session } = authClient.useSession();
	const [keys, setKeys] = React.useState<ManagedApiKey[]>([]);
	const [name, setName] = React.useState("CLI");
	const [createdKey, setCreatedKey] = React.useState<string | null>(null);
	const [loading, setLoading] = React.useState(false);
	const [revokingId, setRevokingId] = React.useState<string | null>(null);

	const refreshKeys = React.useCallback(async () => {
		const { data, error } = await authClient.apiKey.list({
			query: {
				limit: 50,
				sortBy: "createdAt",
				sortDirection: "desc",
			},
		});

		if (error) {
			throw new Error(error.message);
		}

		setKeys((data?.apiKeys ?? []) as ManagedApiKey[]);
	}, []);

	React.useEffect(() => {
		if (!session?.user) {
			setKeys([]);
			return;
		}

		void refreshKeys().catch((error) => {
			toast.error(error instanceof Error ? error.message : "Failed to load API keys");
		});
	}, [refreshKeys, session?.user]);

	const createKey = async () => {
		const trimmedName = name.trim();
		if (!trimmedName) {
			toast.error("Give the API key a name");
			return;
		}

		setLoading(true);
		setCreatedKey(null);

		try {
			const { data, error } = await authClient.apiKey.create({
				name: trimmedName,
				expiresIn: 60 * 60 * 24 * 90,
			});

			if (error) {
				throw new Error(error.message);
			}

			if (!data?.key) {
				throw new Error("The API key was not returned");
			}

			setCreatedKey(data.key);
			await refreshKeys();
			toast.success("API key created");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to create API key");
		} finally {
			setLoading(false);
		}
	};

	const revokeKey = async (keyId: string) => {
		setRevokingId(keyId);

		try {
			const { error } = await authClient.apiKey.delete({ keyId });

			if (error) {
				throw new Error(error.message);
			}

			await refreshKeys();
			toast.success("API key revoked");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to revoke API key");
		} finally {
			setRevokingId(null);
		}
	};

	const copyCreatedKey = async () => {
		if (!createdKey) {
			return;
		}

		await navigator.clipboard.writeText(createdKey);
		toast.success("API key copied");
	};

	if (!session?.user) {
		return null;
	}

	return (
		<section className="mt-10 w-full" aria-labelledby="api-key-heading">
			<div className="mb-4">
				<p className="text-xs font-medium uppercase tracking-widest text-default-500">
					Agent access
				</p>
				<h2 id="api-key-heading" className="text-xl font-semibold text-foreground">
					CLI API keys
				</h2>
				<p className="mt-1 text-sm text-default-500">
					Keys can publish, list, download, and delete only your sites. They expire after 90 days.
				</p>
			</div>

			<div className="rounded-xl border border-default-200 bg-default-50/40 p-4">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
					<Input
						label="Key name"
						labelPlacement="outside"
						value={name}
						onValueChange={setName}
						placeholder="Docs agent"
						maxLength={32}
					/>
					<Button
						className="sm:shrink-0"
						color="secondary"
						isLoading={loading}
						onPress={createKey}
					>
						Create API key
					</Button>
				</div>

				{createdKey && (
					<div className="mt-4 rounded-lg border border-warning-300 bg-warning-50 p-3">
						<p className="text-sm font-medium text-warning-700">
							Copy this key now. It will not be shown again.
						</p>
						<div className="mt-2 flex flex-col gap-2 sm:flex-row">
							<code className="min-w-0 flex-1 overflow-x-auto rounded-md bg-background px-3 py-2 text-xs">
								{createdKey}
							</code>
							<Button size="sm" variant="flat" onPress={copyCreatedKey}>
								Copy
							</Button>
						</div>
						<code className="mt-2 block overflow-x-auto text-xs text-default-600">
							export SMOLL_HOST_TOKEN=&quot;{createdKey}&quot;
						</code>
					</div>
				)}

				<div className="mt-5 space-y-2">
					{keys.length === 0 ? (
						<p className="text-sm text-default-500">No API keys yet.</p>
					) : (
						keys.map((key) => (
							<div
								key={key.id}
								className="flex flex-col gap-3 rounded-lg border border-default-200 bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
							>
								<div className="min-w-0">
									<p className="truncate text-sm font-medium">{key.name ?? "Unnamed key"}</p>
									<p className="mt-1 text-xs text-default-500">
										<code>{key.start ?? "smoll_…"}</code>
										{" · "}
										Created {formatDate(key.createdAt)}
										{" · "}
										Expires {key.expiresAt ? formatDate(key.expiresAt) : "never"}
									</p>
								</div>
								<Button
									className="shrink-0"
									color="danger"
									isLoading={revokingId === key.id}
									size="sm"
									variant="flat"
									onPress={() => revokeKey(key.id)}
								>
									Revoke
								</Button>
							</div>
						))
					)}
				</div>
			</div>
		</section>
	);
}

function formatDate(value: Date | string) {
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
	}).format(new Date(value));
}
