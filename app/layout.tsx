import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Providers } from "./providers";
import { Navbar } from "@/components/navbar";
import { Link } from "@nextui-org/link";
import clsx from "clsx";
import { Toaster as Sonner } from "sonner"

export const metadata: Metadata = {
	title: {
		default: siteConfig.name,
		template: `%s - ${siteConfig.name}`,
	},
	description: siteConfig.description,
	icons: {
		icon: "/favicon.ico",
	},
};

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "white" },
		{ media: "(prefers-color-scheme: dark)", color: "black" },
	],
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head />
			<body
				className={clsx(
					"min-h-screen bg-background font-sans antialiased",
					fontSans.variable
				)}
			>
				<Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
					<div className="app-background relative flex min-h-screen flex-col overflow-hidden">
						<Navbar />
						<main className="container relative z-10 mx-auto max-w-7xl flex-grow px-6 pt-16">
							{children}
						</main>
						<footer className="relative z-10 flex w-full items-center justify-center py-3">
							<Link
								isExternal
								className="text-sm text-default-500"
								href={siteConfig.links.github}
								title="smoll.host source on GitHub"
							>
								smoll.host on GitHub
							</Link>
						</footer>
					</div>
				</Providers>
				<Sonner position="top-center" richColors />
			</body>
		</html>
	);
}
