type NavItem = {
	label: string;
	href: string;
};

export type SiteConfig = {
	name: string;
	description: string;
	publicHost: string;
	navItems: NavItem[];
	navMenuItems: NavItem[];
	links: {
		github: string;
		docs: string;
		sponsor: string;
	};
};

export const siteConfig: SiteConfig = {
	name: "smoll.host",
	description: "Host small static sites on pritish.in subdomains.",
	publicHost: process.env.NEXT_PUBLIC_PUBLIC_HOST ?? "pritish.in",
	navItems: [],
	navMenuItems: [
		{
			label: "Domains",
			href: "/",
		},
		{
			label: "GitHub",
			href: "https://github.com/PritishMishraa/smoll-host",
		},
		{
			label: "Docs",
			href: "https://github.com/PritishMishraa/smoll-host#readme",
		},
	],
	links: {
		github: "https://github.com/PritishMishraa/smoll-host",
		docs: "https://github.com/PritishMishraa/smoll-host#readme",
		sponsor: "https://github.com/sponsors/PritishMishraa",
	},
};

export function getPublicDomainUrl(domain: string) {
	return `https://${domain}.${siteConfig.publicHost}`;
}
