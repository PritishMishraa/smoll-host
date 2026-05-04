import { title, subtitle } from "@/components/primitives";
import DomainName from "@/components/domain-input";
import { AuthButton } from "@/components/auth-button";

export default function Home() {
	return (
		<section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
			<div className="inline-block max-w-lg text-center justify-center">
				<h1 className={title({ color: "violet" })}>smoll.host&nbsp;</h1>
				<br />
				<h2 className={subtitle({ class: "mt-4" })}>
					host your smoll sites with ease
				</h2>
			</div>

			<AuthButton />

			<DomainName/>

		</section>
	);
}
