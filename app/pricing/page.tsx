import { title, subtitle } from "@/components/primitives";

export default function PricingPage() {
	return (
		<div className="flex flex-col items-center gap-3 text-center">
			<h1 className={title()}>Pricing</h1>
			<h2 className={subtitle({ class: "mt-0" })}>
				Simple, transparent pricing for everyone.
			</h2>
		</div>
	);
}
