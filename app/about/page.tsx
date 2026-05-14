import { title, subtitle } from "@/components/primitives";

export default function AboutPage() {
	return (
		<div className="flex flex-col items-center gap-3 text-center">
			<h1 className={title()}>About</h1>
			<h2 className={subtitle({ class: "mt-0" })}>
				Learn more about smoll.host and what we are building.
			</h2>
		</div>
	);
}
