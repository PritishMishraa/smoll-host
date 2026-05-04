import { NextRequest } from "next/server";
import { uploadHtmlForDomain } from "@/lib/domains";
import { requireUserIdFromHeaders } from "@/lib/session";
import { domainNameSchema } from "@/lib/validation";

export const PATCH = async (req: NextRequest) => {
    try {
        const userId = await requireUserIdFromHeaders(req.headers);
        const domainName = req.nextUrl.searchParams.get("domain");
        const body = await req.text();

        if (!domainName || !body) {
            return new Response("Missing domain name or file content", { status: 400 });
        }

        const parsedDomain = domainNameSchema.safeParse(domainName);
        if (!parsedDomain.success) {
            return new Response("Invalid domain name", { status: 400 });
        }

        const file = new File([body], "index.html", { type: "text/html" });
        await uploadHtmlForDomain(parsedDomain.data, userId, file);

        return new Response("File uploaded successfully!", { status: 200 });
    } catch (error) {
        console.error("Error reuploading HTML files:", error);
        const message = error instanceof Error ? error.message : "Error reuploading HTML files";
        const status = message.includes("sign in") ? 401 : message.includes("not found") ? 404 : 500;

        return new Response(message, { status });
    }
}
