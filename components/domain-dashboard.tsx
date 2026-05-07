"use client";

import { Button } from "@nextui-org/button";
import { Link } from "@nextui-org/link";
import React from "react";
import { toast } from "sonner";

import {
	deleteDomain,
	listDomains,
} from "@/components/actions";
import { FileUploader } from "@/components/file-uploader";
import { getPublicDomainUrl, siteConfig } from "@/config/site";
import { authClient } from "@/lib/auth-client";

type HostedDomain = Awaited<ReturnType<typeof listDomains>>[number];

interface DomainDashboardProps {
	refreshKey: number;
}

export function DomainDashboard({ refreshKey }: DomainDashboardProps) {
	const { data: session, isPending } = authClient.useSession();
	const [domains, setDomains] = React.useState<HostedDomain[]>([]);
	const [loading, setLoading] = React.useState(false);
	const [uploadingDomain, setUploadingDomain] = React.useState<HostedDomain | null>(null);
	const [deletingDomain, setDeletingDomain] = React.useState<HostedDomain | null>(null);
	const [fileValue, setFileValue] = React.useState<File[]>([]);
	const [uploading, setUploading] = React.useState(false);
	const [deleting, setDeleting] = React.useState(false);
	const uploadCancelRef = React.useRef<HTMLButtonElement>(null);
	const deleteCancelRef = React.useRef<HTMLButtonElement>(null);

	const refreshDomains = React.useCallback(async () => {
		if (!session?.user) {
			setDomains([]);
			return;
		}

		setLoading(true);
		try {
			setDomains(await listDomains());
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to load domains");
		} finally {
			setLoading(false);
		}
	}, [session?.user]);

	React.useEffect(() => {
		refreshDomains();
	}, [refreshDomains, refreshKey]);

	const openUpload = (hostedDomain: HostedDomain) => {
		setFileValue([]);
		setUploadingDomain(hostedDomain);
	};

	React.useEffect(() => {
		if (!uploadingDomain && !deletingDomain) {
			return;
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") {
				return;
			}

			setUploadingDomain(null);
			setDeletingDomain(null);
			setFileValue([]);
		};

		document.body.style.overflow = "hidden";
		document.addEventListener("keydown", onKeyDown);

		requestAnimationFrame(() => {
			(uploadingDomain ? uploadCancelRef : deleteCancelRef).current?.focus();
		});

		return () => {
			document.body.style.overflow = "";
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [deletingDomain, uploadingDomain]);

	const replaceHtml = async () => {
		if (!uploadingDomain || fileValue.length === 0) {
			toast.error("Select an HTML file first");
			return;
		}

		setUploading(true);
		try {
			const formData = new FormData();
			formData.set("file", fileValue[0]);

			const response = await fetch(`/api/domains/${uploadingDomain.name}/upload`, {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const payload = await response.json().catch(() => null);
				throw new Error(payload?.error ?? "Failed to upload HTML file");
			}

			await refreshDomains();
			setUploadingDomain(null);
			setFileValue([]);
			toast.success("HTML file updated");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to upload HTML file");
		} finally {
			setUploading(false);
		}
	};

	const confirmDelete = async () => {
		if (!deletingDomain) {
			return;
		}

		setDeleting(true);
		try {
			const result = await deleteDomain(deletingDomain.name);
			if (!result.ok) {
				throw new Error(result.error);
			}

			await refreshDomains();
			setDeletingDomain(null);
			toast.success("Domain deleted");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to delete domain");
		} finally {
			setDeleting(false);
		}
	};

	if (isPending || !session?.user) {
		return null;
	}

	return (
		<section className="mt-8 w-full">
			<div className="mb-3 flex items-end justify-between gap-3">
				<div>
					<p className="text-xs uppercase tracking-widest text-default-500">
						Your domains
					</p>
					<h2 className="text-xl font-semibold text-foreground">
						Domains
					</h2>
				</div>
				<Button size="sm" variant="flat" onPress={refreshDomains} isLoading={loading}>
					Refresh
				</Button>
			</div>

			{domains.length === 0 ? (
				<div className="rounded-lg border border-dashed border-default-200 bg-default-50/40 px-4 py-8 text-center text-sm text-default-500">
					No domains yet.
				</div>
			) : (
				<div className="grid gap-3">
					{domains.map((hostedDomain) => (
						<div
							key={hostedDomain.id}
							className="flex flex-col gap-3 rounded-lg border border-default-200 bg-default-50/40 p-4 sm:flex-row sm:items-center sm:justify-between"
						>
							<div className="min-w-0">
								<Link
									isExternal
									className="block truncate text-base font-medium text-foreground"
									href={getPublicDomainUrl(hostedDomain.name)}
								>
									{hostedDomain.name}.{siteConfig.publicHost}
								</Link>
								<p className="mt-1 text-xs text-default-500">
									{hostedDomain.publishedAt
										? `Published ${formatDate(hostedDomain.publishedAt)}`
										: "No HTML file uploaded yet"}
								</p>
							</div>
							<div className="flex shrink-0 flex-wrap gap-2">
								<Button
									as={Link}
									href={getPublicDomainUrl(hostedDomain.name)}
									isExternal
									size="sm"
									variant="flat"
								>
									Open
								</Button>
								<Button
									color="secondary"
									size="sm"
									variant="flat"
									onPress={() => openUpload(hostedDomain)}
								>
									Upload HTML
								</Button>
								<Button
									color="danger"
									size="sm"
									variant="flat"
									onPress={() => setDeletingDomain(hostedDomain)}
								>
									Delete
								</Button>
							</div>
						</div>
					))}
				</div>
			)}

			{uploadingDomain && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" role="presentation" onMouseDown={() => {
					setUploadingDomain(null);
					setFileValue([]);
				}}>
					<div
						aria-labelledby="upload-dialog-title"
						aria-modal="true"
						className="w-full max-w-xl overflow-hidden rounded-lg border border-default-200 bg-background shadow-2xl"
						role="dialog"
						onMouseDown={(event) => event.stopPropagation()}
					>
						<div className="border-b border-default-200 px-5 py-4">
							<p className="text-xs uppercase tracking-widest text-default-500">
								Replace HTML
							</p>
							<h3 id="upload-dialog-title" className="truncate text-lg font-semibold">
								{uploadingDomain.name}.{siteConfig.publicHost}
							</h3>
						</div>
						<div className="p-5">
							<FileUploader
								value={fileValue}
								onValueChange={setFileValue}
								maxSize={16 * 1024 * 1024}
								maxFiles={1}
							/>
						</div>
						<div className="flex items-center justify-end gap-2 border-t border-default-200 px-5 py-4">
							<Button
								ref={uploadCancelRef}
								variant="flat"
								onPress={() => {
									setUploadingDomain(null);
									setFileValue([]);
								}}
							>
								Cancel
							</Button>
							<Button
								color="secondary"
								isDisabled={fileValue.length === 0}
								isLoading={uploading}
								onPress={replaceHtml}
							>
								Upload file
							</Button>
						</div>
					</div>
				</div>
			)}

			{deletingDomain && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" role="presentation" onMouseDown={() => setDeletingDomain(null)}>
					<div
						aria-labelledby="delete-dialog-title"
						aria-modal="true"
						className="w-full max-w-md rounded-lg border border-danger-200 bg-background p-5 shadow-2xl"
						role="dialog"
						onMouseDown={(event) => event.stopPropagation()}
					>
						<p className="text-xs uppercase tracking-widest text-danger">
							Delete domain
						</p>
						<h3 id="delete-dialog-title" className="mt-1 text-lg font-semibold">
							{deletingDomain.name}.{siteConfig.publicHost}
						</h3>
						<p className="mt-3 text-sm text-default-500">
							This removes the domain and deletes its uploaded HTML file.
						</p>
						<div className="mt-5 flex justify-end gap-2">
							<Button ref={deleteCancelRef} variant="flat" onPress={() => setDeletingDomain(null)}>
								Cancel
							</Button>
							<Button color="danger" isLoading={deleting} onPress={confirmDelete}>
								Delete
							</Button>
						</div>
					</div>
				</div>
			)}
		</section>
	);
}

function formatDate(value: Date | string) {
	return new Intl.DateTimeFormat("en", {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(new Date(value));
}
