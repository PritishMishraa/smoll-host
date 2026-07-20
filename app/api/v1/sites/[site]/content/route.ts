import { apiError, createRequestId } from "@/lib/api";
import { requireSiteApiKey } from "@/lib/api-auth";
import { downloadHtmlForDomain } from "@/lib/domains";
import { domainNameSchema } from "@/lib/validation";

interface RouteParams {
	params: {
		site: string;
	};
}

export async function GET(request: Request, { params }: RouteParams) {
	const requestId = createRequestId(request.headers);

	try {
		const { userId } = await requireSiteApiKey(request.headers, "read");
		const siteName = domainNameSchema.parse(params.site);
		const html = await downloadHtmlForDomain(siteName, userId);

		return new Response(html, {
			headers: {
				"Cache-Control": "no-store",
				"Content-Disposition": `attachment; filename="${siteName}.html"`,
				"Content-Type": "text/html; charset=utf-8",
				"X-Request-Id": requestId,
			},
		});
	} catch (error) {
		return apiError(error, requestId);
	}
}
