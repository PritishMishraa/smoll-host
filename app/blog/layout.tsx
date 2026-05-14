export default function BlogLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-6 py-8 md:py-10">
			{children}
		</section>
	);
}
