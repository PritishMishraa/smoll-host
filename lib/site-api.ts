import { createHash } from "node:crypto";

import { getPublicDomainUrl } from "@/config/site";
import { ApiRequestError } from "@/lib/api-error";
import { MAX_HTML_FILE_SIZE } from "@/lib/validation";

interface SiteRecord {
	id: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
	publishedAt: Date | null;
}

export function serializeSite(site: SiteRecord) {
	return {
		id: site.id,
		name: site.name,
		url: getPublicDomainUrl(site.name),
		createdAt: site.createdAt.toISOString(),
		updatedAt: site.updatedAt.toISOString(),
		publishedAt: site.publishedAt?.toISOString() ?? null,
	};
}

export async function readHtmlUpload(request: Request) {
	const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();

	if (contentType !== "text/html") {
		throw new ApiRequestError(
			415,
			"UNSUPPORTED_MEDIA_TYPE",
			"Upload the document with Content-Type: text/html"
		);
	}

	const declaredLength = Number(request.headers.get("content-length"));
	if (Number.isFinite(declaredLength) && declaredLength > MAX_HTML_FILE_SIZE) {
		throw fileTooLargeError();
	}

	if (!request.body) {
		throw new ApiRequestError(400, "EMPTY_HTML", "The HTML document cannot be empty");
	}

	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let bytes = 0;

	while (true) {
		const { done, value } = await reader.read();

		if (done) {
			break;
		}

		bytes += value.byteLength;
		if (bytes > MAX_HTML_FILE_SIZE) {
			await reader.cancel();
			throw fileTooLargeError();
		}

		chunks.push(value);
	}

	if (bytes === 0) {
		throw new ApiRequestError(400, "EMPTY_HTML", "The HTML document cannot be empty");
	}

	const file = new File(chunks, "index.html", { type: "text/html" });
	const sha256 = createHash("sha256")
		.update(Buffer.from(await file.arrayBuffer()))
		.digest("hex");

	return { bytes, file, sha256 };
}

function fileTooLargeError() {
	return new ApiRequestError(
		413,
		"HTML_TOO_LARGE",
		`The HTML document must be ${MAX_HTML_FILE_SIZE / (1024 * 1024)} MB or smaller`
	);
}
