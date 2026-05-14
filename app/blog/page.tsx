import { title, subtitle } from "@/components/primitives";

export default function BlogPage() {
	return (
		<div className="flex flex-col items-center gap-3 text-center">
			<h1 className={title()}>Blog</h1>
			<h2 className={subtitle({ class: "mt-0" })}>
				Updates, tips, and stories from the team.
			</h2>
		</div>
	);
}
