import { NextRequest } from "next/server";
import { getSignedURL } from "@/components/actions";

export const PATCH = async (req: NextRequest) => {
    try {
        const domainName = req.nextUrl.searchParams.get("domain");
        const token = req.headers.get("Authorization");

        if (!token) {
            return new Response("Authorization token is required", { status: 401 });
        }
        if (token !== process.env.REUPLOAD_TOKEN) {
            return new Response("Invalid Authorization token", { status: 401 });
        }

        const body = await req.text();

        if (!domainName || !body) {
            return new Response("Missing domain name or file content", { status: 400 });
        }

        const signedUrl = await getSignedURL(domainName);
        const url = signedUrl.success.url;

        const resp = await fetch(url, {
            method: "PUT",
            body,
            headers: {
                "Content-Type": "text/html",
            },
        });

        if (!resp.ok) {
            throw new Error("Failed to upload file");
        }

        return new Response("File uploaded successfully!", { status: 200 });
    } catch (error) {
        console.error("Error reuploading HTML files:", error);
        return new Response("Error reuploading HTML files", { status: 500 });
    }
}