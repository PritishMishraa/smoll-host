type NavItem = {
	label: string;
	href: string;
};

export type SiteConfig = {
	name: string;
	description: string;
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
	navItems: [],
	navMenuItems: [
		{
			label: "Projects",
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
