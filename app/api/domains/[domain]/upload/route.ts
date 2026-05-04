import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { uploadHtmlForDomain } from "@/lib/domains";
import { requireUserIdFromHeaders } from "@/lib/session";
import { domainNameSchema } from "@/lib/validation";

interface RouteParams {
	params: {
		domain: string;
	};
}

export async function POST(req: NextRequest, { params }: RouteParams) {
	try {
		const userId = await requireUserIdFromHeaders(req.headers);
		const parsedDomain = domainNameSchema.parse(params.domain);
		const formData = await req.formData();
		const file = formData.get("file");

		if (!(file instanceof File)) {
			return NextResponse.json({ error: "HTML file is required" }, { status: 400 });
		}

		await uploadHtmlForDomain(parsedDomain, userId, file);

		return NextResponse.json({ ok: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to upload file";
		const status = message.includes("sign in") ? 401 : message.includes("not found") ? 404 : 400;

		return NextResponse.json({ error: message }, { status });
	}
}
