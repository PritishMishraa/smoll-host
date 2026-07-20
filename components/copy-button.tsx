"use client";

import { Button } from "@nextui-org/button";
import * as React from "react";
import { toast } from "sonner";

interface CopyButtonProps {
	text: string;
	label?: string;
	toastMessage?: string;
}

export function CopyButton({ text, label = "Copy", toastMessage = "Copied to clipboard" }: CopyButtonProps) {
	const [copied, setCopied] = React.useState(false);
	const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	React.useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			toast.error("Could not copy to the clipboard");
			return;
		}

		setCopied(true);
		toast.success(toastMessage);

		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
		timeoutRef.current = setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Button
			size="sm"
			variant="flat"
			color={copied ? "success" : "default"}
			onPress={copy}
			startContent={
				copied ? (
					<CheckIcon className="h-3.5 w-3.5" />
				) : (
					<CopyIcon className="h-3.5 w-3.5" />
				)
			}
		>
			{copied ? "Copied" : label}
		</Button>
	);
}

function CopyIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			aria-hidden="true"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth={1.5}
			{...props}
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
			/>
		</svg>
	);
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			aria-hidden="true"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth={2}
			{...props}
		>
			<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
		</svg>
	);
}
