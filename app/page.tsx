import { Link } from "@nextui-org/link";
import { button as buttonStyles } from "@nextui-org/theme";
import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { SignInIcon } from "@/components/icons";
import DomainName from "@/components/domain-input";

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

			<Link
				isExternal
				className={buttonStyles({ variant: "bordered", radius: "full" })}
				href={siteConfig.links.github}
			>
				<SignInIcon size={20} />
				GitHub
			</Link>

			<DomainName/>

		</section>
	);
}
