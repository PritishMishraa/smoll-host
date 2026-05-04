import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createDomainForUser, deleteDomainForUser, uploadHtmlForDomain } from "@/lib/domains";
import { requireUserIdFromHeaders } from "@/lib/session";
import { domainNameSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
	try {
		const userId = await requireUserIdFromHeaders(req.headers);
		const formData = await req.formData();
		const domainName = formData.get("domain");
		const file = formData.get("file");

		if (typeof domainName !== "string") {
			return NextResponse.json({ error: "Domain name is required" }, { status: 400 });
		}

		const parsedDomain = domainNameSchema.parse(domainName);
		const createdDomain = await createDomainForUser(parsedDomain, userId);

		if (file instanceof File) {
			try {
				await uploadHtmlForDomain(createdDomain.name, userId, file);
			} catch (error) {
				try {
					await deleteDomainForUser(createdDomain.name, userId);
				} catch (rollbackError) {
					console.error("Failed to roll back domain after upload failure:", rollbackError);
				}
				throw error;
			}
		}

		return NextResponse.json({ domain: createdDomain });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to create domain";
		const status = message.includes("sign in") ? 401 : 400;

		return NextResponse.json({ error: message }, { status });
	}
}
