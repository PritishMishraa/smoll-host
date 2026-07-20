import { apiError, apiJson, createRequestId } from "@/lib/api";
import { requireSiteApiKey } from "@/lib/api-auth";
import { listDomainsForUser } from "@/lib/domains";
import { serializeSite } from "@/lib/site-api";

export async function GET(request: Request) {
	const requestId = createRequestId(request.headers);

	try {
		const { userId } = await requireSiteApiKey(request.headers, "read");
		const sites = await listDomainsForUser(userId);

		return apiJson(
			{
				ok: true,
				sites: sites.map(serializeSite),
			},
			{ requestId }
		);
	} catch (error) {
		return apiError(error, requestId);
	}
}
