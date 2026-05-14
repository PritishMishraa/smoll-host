import { title, subtitle } from "@/components/primitives";
import DomainName from "@/components/domain-input";

export default function Home() {
	return (
		<section className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-8 py-8 md:py-12">
			<div className="flex max-w-lg flex-col items-center gap-3 text-center">
				<h1 className={title({ color: "violet" })}>smoll.host</h1>
				<h2 className={subtitle({ class: "mt-0 text-default-500" })}>
					Your HTML live in 30 seconds. No config, no CLI, just a subdomain and a file.
				</h2>
			</div>

			<DomainName />
		</section>
	);
}
