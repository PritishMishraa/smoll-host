import { title, subtitle } from "@/components/primitives";
import DomainName from "@/components/domain-input";

export default function Home() {
	return (
		<section className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-6 py-8 md:py-10">
			<div className="flex max-w-lg flex-col items-center gap-3 text-center">
				<h1 className={title({ color: "violet" })}>smoll.host</h1>
				<h2 className={subtitle({ class: "mt-0" })}>
					host your smoll sites with ease
				</h2>
			</div>

			<DomainName />
		</section>
	);
}
