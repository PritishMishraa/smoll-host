import { describe, expect, it } from "vitest";

import { ApiRequestError } from "@/lib/api-error";
import { readHtmlUpload, serializeSite } from "@/lib/site-api";

describe("site API helpers", () => {
	it("reads an HTML request and returns deterministic metadata", async () => {
		const request = new Request("https://smoll.host/api/v1/sites/docs", {
			method: "PUT",
			headers: {
				"Content-Type": "text/html; charset=utf-8",
			},
			body: "<h1>Hello</h1>",
		});

		const upload = await readHtmlUpload(request);

		expect(upload.bytes).toBe(14);
		expect(upload.file.name).toBe("index.html");
		expect(upload.file.type).toBe("text/html");
		expect(upload.sha256).toBe(
			"e2c6c0ea7c7900c31f953e48d30d5e839801ab90630d751e7c8426ed5859da47"
		);
	});

	it("rejects unsupported content types", async () => {
		const request = new Request("https://smoll.host/api/v1/sites/docs", {
			method: "PUT",
			headers: {
				"Content-Type": "text/plain",
			},
			body: "<h1>Hello</h1>",
		});

		await expect(readHtmlUpload(request)).rejects.toMatchObject({
			status: 415,
			code: "UNSUPPORTED_MEDIA_TYPE",
		} satisfies Partial<ApiRequestError>);
	});

	it("serializes site dates and public URL", () => {
		expect(
			serializeSite({
				id: "site-id",
				name: "docs",
				createdAt: new Date("2026-07-20T00:00:00.000Z"),
				updatedAt: new Date("2026-07-20T01:00:00.000Z"),
				publishedAt: null,
			})
		).toEqual({
			id: "site-id",
			name: "docs",
			url: "https://docs.pritish.in",
			createdAt: "2026-07-20T00:00:00.000Z",
			updatedAt: "2026-07-20T01:00:00.000Z",
			publishedAt: null,
		});
	});
});
