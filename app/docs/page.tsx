import { title, subtitle } from "@/components/primitives";

export default function DocsPage() {
	return (
		<div className="flex flex-col items-center gap-3 text-center">
			<h1 className={title()}>Docs</h1>
			<h2 className={subtitle({ class: "mt-0" })}>
				Everything you need to get started.
			</h2>
		</div>
	);
}
