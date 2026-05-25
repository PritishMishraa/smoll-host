import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { downloadHtmlForDomain } from "@/lib/domains";
import { requireUserIdFromHeaders } from "@/lib/session";
import { domainNameSchema } from "@/lib/validation";

interface RouteParams {
	params: {
		domain: string;
	};
}

export async function GET(req: NextRequest, { params }: RouteParams) {
	try {
		const userId = await requireUserIdFromHeaders(req.headers);
		const parsedDomain = domainNameSchema.parse(params.domain);
		const html = await downloadHtmlForDomain(parsedDomain, userId);

		return new Response(html, {
			headers: {
				"Content-Disposition": `attachment; filename="${parsedDomain}.html"`,
				"Content-Type": "text/html; charset=utf-8",
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to download file";
		const status = message.includes("sign in")
			? 401
			: message.includes("not found")
				? 404
				: 400;

		return NextResponse.json({ error: message }, { status });
	}
}
