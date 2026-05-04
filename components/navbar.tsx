import {
	Navbar as NextUINavbar,
	NavbarContent,
	NavbarBrand,
	NavbarItem,
} from "@nextui-org/navbar";
import { Link } from "@nextui-org/link";

import { link as linkStyles } from "@nextui-org/theme";

import { siteConfig } from "@/config/site";
import NextLink from "next/link";
import clsx from "clsx";

import { ThemeSwitch } from "@/components/theme-switch";
import { GithubIcon } from "@/components/icons";

import { Logo } from "@/components/icons";
import { AuthButton } from "@/components/auth-button";

export const Navbar = () => {
	return (
		<NextUINavbar
			classNames={{
				base: "border-b border-white/0 bg-transparent backdrop-blur-none data-[menu-open=true]:bg-background/70",
				wrapper: "bg-transparent",
				menu: "border-t border-default-200/40 bg-background/80 backdrop-blur-md",
			}}
			maxWidth="xl"
			position="sticky"
		>
			<NavbarContent className="basis-1/5 sm:basis-full" justify="start">
				<NavbarBrand as="li" className="gap-3 max-w-fit">
					<NextLink className="flex justify-start items-center gap-1" href="/">
						<Logo />
						<p className="font-bold text-inherit">smoll.host</p>
					</NextLink>
				</NavbarBrand>
				<ul className="hidden lg:flex gap-4 justify-start ml-2">
					{siteConfig.navItems.map((item) => (
						<NavbarItem key={item.href}>
							<NextLink
								className={clsx(
									linkStyles({ color: "foreground" }),
									"data-[active=true]:text-primary data-[active=true]:font-medium"
								)}
								color="foreground"
								href={item.href}
							>
								{item.label}
							</NextLink>
						</NavbarItem>
					))}
				</ul>
			</NavbarContent>

			<NavbarContent
				className="basis-1/5 sm:basis-full"
				justify="end"
			>
				<NavbarItem className="flex gap-2">
					<Link
						isExternal
						aria-label="Github"
						className="sm:flex"
						href={siteConfig.links.github}
					>
						<GithubIcon className="text-default-500" />
					</Link>
					<ThemeSwitch />
				</NavbarItem>
				<NavbarItem>
					<AuthButton />
				</NavbarItem>
			</NavbarContent>
		</NextUINavbar>
	);
};
