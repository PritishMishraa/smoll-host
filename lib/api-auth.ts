import "server-only";

import { ApiRequestError } from "@/lib/api-error";
import { getAuth } from "@/lib/auth";

export type SitePermission = "read" | "write" | "delete";

export async function requireSiteApiKey(headers: Headers, permission: SitePermission) {
	const key = getApiKey(headers);

	if (!key) {
		throw new ApiRequestError(
			401,
			"API_KEY_REQUIRED",
			"Provide an API key through SMOLL_HOST_TOKEN"
		);
	}

	const result = await getAuth().api.verifyApiKey({
		body: {
			key,
			permissions: {
				sites: [permission],
			},
		},
	});

	if (!result.valid || !result.key) {
		const permissionDenied = result.error?.code?.toLowerCase().includes("permission");

		throw new ApiRequestError(
			permissionDenied ? 403 : 401,
			permissionDenied ? "INSUFFICIENT_PERMISSION" : "INVALID_API_KEY",
			permissionDenied
				? `The API key does not have sites:${permission} permission`
				: "The API key is invalid, expired, disabled, or rate limited"
		);
	}

	return {
		apiKeyId: result.key.id,
		userId: result.key.referenceId,
	};
}

function getApiKey(headers: Headers) {
	const directKey = headers.get("x-api-key")?.trim();

	if (directKey) {
		return directKey;
	}

	const authorization = headers.get("authorization")?.trim();

	if (!authorization) {
		return null;
	}

	const [scheme, token] = authorization.split(/\s+/, 2);
	return scheme?.toLowerCase() === "bearer" && token ? token : null;
}
