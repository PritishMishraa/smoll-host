import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { ApiRequestError } from "@/lib/api-error";
import { DomainAlreadyTakenError, DomainNotFoundError } from "@/lib/domains";
import { HtmlNotFoundError } from "@/lib/storage";

export function createRequestId(headers: Headers) {
	return headers.get("x-request-id")?.slice(0, 128) || randomUUID();
}

export function apiJson(
	body: Record<string, unknown>,
	options: { requestId: string; status?: number }
) {
	return NextResponse.json(body, {
		status: options.status ?? 200,
		headers: {
			"Cache-Control": "no-store",
			"X-Request-Id": options.requestId,
		},
	});
}

export function apiError(error: unknown, requestId: string) {
	if (error instanceof ApiRequestError) {
		return apiJson(
			{
				ok: false,
				error: {
					code: error.code,
					message: error.message,
					requestId,
				},
			},
			{ requestId, status: error.status }
		);
	}

	if (error instanceof DomainAlreadyTakenError) {
		return apiJson(
			{
				ok: false,
				error: {
					code: "SITE_TAKEN",
					message: error.message,
					requestId,
				},
			},
			{ requestId, status: 409 }
		);
	}

	if (error instanceof DomainNotFoundError) {
		return apiJson(
			{
				ok: false,
				error: {
					code: "SITE_NOT_FOUND",
					message: error.message,
					requestId,
				},
			},
			{ requestId, status: 404 }
		);
	}

	if (error instanceof HtmlNotFoundError) {
		return apiJson(
			{
				ok: false,
				error: {
					code: "HTML_NOT_FOUND",
					message: error.message,
					requestId,
				},
			},
			{ requestId, status: 404 }
		);
	}

	if (error instanceof ZodError) {
		return apiJson(
			{
				ok: false,
				error: {
					code: "VALIDATION_ERROR",
					message: error.issues[0]?.message ?? "The request is invalid",
					requestId,
				},
			},
			{ requestId, status: 400 }
		);
	}

	console.error(`[api:${requestId}]`, error);

	return apiJson(
		{
			ok: false,
			error: {
				code: "INTERNAL_ERROR",
				message: "The request could not be completed",
				requestId,
			},
		},
		{ requestId, status: 500 }
	);
}
