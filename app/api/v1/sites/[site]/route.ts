import { apiError, apiJson, createRequestId } from "@/lib/api";
import { requireSiteApiKey } from "@/lib/api-auth";
import {
	deleteDomainForUser,
	getDomainForUser,
	publishHtmlForDomain,
} from "@/lib/domains";
import { readHtmlUpload, serializeSite } from "@/lib/site-api";
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
		const site = await getDomainForUser(siteName, userId);

		return apiJson(
			{
				ok: true,
				site: serializeSite(site),
			},
			{ requestId }
		);
	} catch (error) {
		return apiError(error, requestId);
	}
}

export async function PUT(request: Request, { params }: RouteParams) {
	const requestId = createRequestId(request.headers);

	try {
		const { userId } = await requireSiteApiKey(request.headers, "write");
		const siteName = domainNameSchema.parse(params.site);
		const upload = await readHtmlUpload(request);
		const result = await publishHtmlForDomain(siteName, userId, upload.file);

		return apiJson(
			{
				ok: true,
				created: result.created,
				bytes: upload.bytes,
				sha256: upload.sha256,
				site: serializeSite(result.domain),
			},
			{ requestId, status: result.created ? 201 : 200 }
		);
	} catch (error) {
		return apiError(error, requestId);
	}
}

export async function DELETE(request: Request, { params }: RouteParams) {
	const requestId = createRequestId(request.headers);

	try {
		const { userId } = await requireSiteApiKey(request.headers, "delete");
		const siteName = domainNameSchema.parse(params.site);
		await deleteDomainForUser(siteName, userId);

		return apiJson(
			{
				ok: true,
				deleted: siteName,
			},
			{ requestId }
		);
	} catch (error) {
		return apiError(error, requestId);
	}
}
