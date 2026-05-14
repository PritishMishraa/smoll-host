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

import { motion } from "framer-motion";

type HostedDomain = Awaited<ReturnType<typeof listDomains>>[number];

interface DomainDashboardProps {
	refreshKey: number;
	onCreateSite: () => void;
}

const focusableSelector = [
	"a[href]",
	"button:not([disabled])",
	"input:not([disabled])",
	"select:not([disabled])",
	"textarea:not([disabled])",
	'[tabindex]:not([tabindex="-1"])',
].join(",");

export function DomainDashboard({ refreshKey, onCreateSite }: DomainDashboardProps) {
	const { data: session, isPending } = authClient.useSession();
	const [domains, setDomains] = React.useState<HostedDomain[]>([]);
	const [loading, setLoading] = React.useState(false);
	const [uploadingDomain, setUploadingDomain] = React.useState<HostedDomain | null>(null);
	const [deletingDomain, setDeletingDomain] = React.useState<HostedDomain | null>(null);
	const [fileValue, setFileValue] = React.useState<File[]>([]);
	const [uploading, setUploading] = React.useState(false);
	const [deleting, setDeleting] = React.useState(false);
	const [uploadError, setUploadError] = React.useState<string | null>(null);
	const uploadCancelRef = React.useRef<HTMLButtonElement>(null);
	const deleteCancelRef = React.useRef<HTMLButtonElement>(null);
	const previousFocusRef = React.useRef<HTMLElement | null>(null);

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
		previousFocusRef.current = document.activeElement instanceof HTMLElement
			? document.activeElement
			: null;
		setFileValue([]);
		setUploadError(null);
		setUploadingDomain(hostedDomain);
	};

	const openDelete = (hostedDomain: HostedDomain) => {
		previousFocusRef.current = document.activeElement instanceof HTMLElement
			? document.activeElement
			: null;
		setDeletingDomain(hostedDomain);
	};

	const closeDialog = React.useCallback(() => {
		setUploadingDomain(null);
		setDeletingDomain(null);
		setFileValue([]);
		setUploadError(null);

		const previousFocus = previousFocusRef.current;
		previousFocusRef.current = null;

		requestAnimationFrame(() => {
			if (previousFocus && document.contains(previousFocus)) {
				previousFocus.focus();
			}
		});
	}, []);

	React.useEffect(() => {
		if (!uploadingDomain && !deletingDomain) {
			return;
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
				closeDialog();
				return;
			}

			if (event.key !== "Tab") {
				return;
			}

			const dialog = document.getElementById(uploadingDomain ? "upload-dialog" : "delete-dialog");
			if (!dialog) {
				return;
			}

			const focusableElements = Array.from(
				dialog.querySelectorAll<HTMLElement>(focusableSelector)
			).filter((element) => element.offsetParent !== null);

			if (focusableElements.length === 0) {
				event.preventDefault();
				return;
			}

			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];

			if (event.shiftKey && document.activeElement === firstElement) {
				event.preventDefault();
				lastElement.focus();
			} else if (!event.shiftKey && document.activeElement === lastElement) {
				event.preventDefault();
				firstElement.focus();
			}
		};

		document.body.style.overflow = "hidden";
		document.addEventListener("keydown", onKeyDown);

		requestAnimationFrame(() => {
			if (deletingDomain) {
				deleteCancelRef.current?.focus();
			}
		});

		return () => {
			document.body.style.overflow = "";
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [closeDialog, deletingDomain, uploadingDomain]);

	const replaceHtml = async () => {
		if (!uploadingDomain || fileValue.length === 0) {
			toast.error("Select an HTML file first");
			return;
		}

		setUploading(true);
		setUploadError(null);
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
			closeDialog();
			setFileValue([]);
			toast.success("HTML file updated");
		} catch (error) {
			const message = error instanceof Error ? error.message : "Failed to upload HTML file";
			setUploadError(message);
			toast.error(message);
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
			closeDialog();
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
		<section className="mt-10 w-full">
			<div className="mb-4 flex items-end justify-between gap-3">
				<div>
					<p className="text-xs font-medium uppercase tracking-widest text-default-500">
						Your sites
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
				<motion.div
					className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-default-200 bg-default-50/40 px-6 py-12 text-center"
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
				>
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-default-100 text-default-500">
						<svg
							className="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={1.5}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.377 0-4.485-.448-6.324-1.195m15.686 0A11.953 11.953 0 0112 16.5c-2.377 0-4.485-.448-6.324-1.195"
							/>
						</svg>
					</div>
					<div>
						<p className="text-base font-medium text-foreground">No sites yet</p>
						<p className="mt-1 max-w-xs text-sm text-default-500">
							Claim a subdomain and upload an HTML file to get started.
						</p>
					</div>
					<Button
						size="sm"
						color="secondary"
						variant="flat"
						onPress={onCreateSite}
					>
						Create your first site
					</Button>
				</motion.div>
			) : (
				<div className="grid gap-3">
					{domains.map((hostedDomain) => (
						<div
							key={hostedDomain.id}
							className="flex flex-col gap-3 rounded-xl border border-default-200 bg-default-50/40 p-4 sm:flex-row sm:items-center sm:justify-between"
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
									onPress={() => openDelete(hostedDomain)}
								>
									Delete
								</Button>
							</div>
						</div>
					))}
				</div>
			)}

			{uploadingDomain && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" role="presentation" onMouseDown={closeDialog}>
					<div
						aria-labelledby="upload-dialog-title"
						aria-modal="true"
						id="upload-dialog"
						className="w-full max-w-xl overflow-hidden rounded-xl border border-default-200 bg-background shadow-2xl"
						role="dialog"
						onMouseDown={(event) => event.stopPropagation()}
					>
						<div className="border-b border-default-200 px-5 py-4">
							<p className="text-xs font-medium uppercase tracking-widest text-default-500">
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
								inlineError={uploadError}
								autoFocus
							/>
						</div>
						<div className="flex items-center justify-end gap-2 border-t border-default-200 px-5 py-4">
							<Button
								ref={uploadCancelRef}
								variant="flat"
								onPress={closeDialog}
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
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" role="presentation" onMouseDown={closeDialog}>
					<div
						aria-labelledby="delete-dialog-title"
						aria-modal="true"
						id="delete-dialog"
						className="w-full max-w-md rounded-xl border border-danger-200 bg-background p-5 shadow-2xl"
						role="dialog"
						onMouseDown={(event) => event.stopPropagation()}
					>
						<p className="text-xs font-medium uppercase tracking-widest text-danger">
							Delete domain
						</p>
						<h3 id="delete-dialog-title" className="mt-1 text-lg font-semibold">
							{deletingDomain.name}.{siteConfig.publicHost}
						</h3>
						<p className="mt-3 text-sm text-default-500">
							This removes the domain and deletes its uploaded HTML file.
						</p>
						<div className="mt-5 flex justify-end gap-2">
							<Button ref={deleteCancelRef} variant="flat" onPress={closeDialog}>
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
