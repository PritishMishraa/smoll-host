import { describe, expect, it, vi } from "vitest";

import { SmollApiClient, SmollApiError } from "../cli/src/client";
import { parseArgs, runCli, type CliIo } from "../cli/src/commands";

describe("smoll CLI", () => {
	it("parses agent-friendly deploy flags", () => {
		expect(
			parseArgs(["deploy", "-", "--site", "docs", "--json", "--api-url=https://api.test"])
		).toMatchObject({
			positionals: ["deploy", "-"],
			flags: {
				site: "docs",
				json: true,
				apiUrl: "https://api.test",
			},
		});
	});

	it("publishes stdin HTML and prints stable JSON", async () => {
		const stdout: string[] = [];
		const stderr: string[] = [];
		const fetchImpl = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
			expect(init?.method).toBe("PUT");
			expect(new Headers(init?.headers).get("authorization")).toBe("Bearer smoll_test_token_that_is_long_enough");
			expect(new Headers(init?.headers).get("content-type")).toContain("text/html");

			return jsonResponse(
				{
					ok: true,
					created: true,
					bytes: 14,
					sha256: "abc123",
					site: {
						id: "site-id",
						name: "docs",
						url: "https://docs.pritish.in",
						createdAt: "2026-07-20T00:00:00.000Z",
						updatedAt: "2026-07-20T00:00:00.000Z",
						publishedAt: "2026-07-20T00:00:00.000Z",
					},
				},
				{ status: 201 }
			);
		});
		const io: CliIo = {
			env: {
				NODE_ENV: "test",
				SMOLL_HOST_TOKEN: "smoll_test_token_that_is_long_enough",
				SMOLL_HOST_API_URL: "https://api.test",
			},
			stdout: (message) => stdout.push(message),
			stderr: (message) => stderr.push(message),
			readStdin: async () => new TextEncoder().encode("<h1>Hello</h1>"),
			fetchImpl: fetchImpl as typeof fetch,
		};

		const exitCode = await runCli(["deploy", "-", "--site", "docs", "--json"], io);

		expect(exitCode).toBe(0);
		expect(fetchImpl).toHaveBeenCalledWith(
			"https://api.test/api/v1/sites/docs",
			expect.any(Object)
		);
		expect(JSON.parse(stdout.join(""))).toMatchObject({
			ok: true,
			created: true,
			site: { name: "docs" },
		});
		expect(stderr).toEqual([]);
	});

	it("uses the deployed application as the default API origin", async () => {
		const fetchImpl = vi.fn(async () =>
			jsonResponse({
				ok: true,
				sites: [],
			})
		);
		const io: CliIo = {
			env: {
				NODE_ENV: "test",
				SMOLL_HOST_TOKEN: "smoll_test_token_that_is_long_enough",
				SMOLL_CONFIG_DIR: "/tmp/smoll-cli-missing-config",
			},
			stdout: vi.fn(),
			stderr: vi.fn(),
			readStdin: async () => new Uint8Array(),
			fetchImpl: fetchImpl as typeof fetch,
		};

		const exitCode = await runCli(["sites", "list", "--json"], io);

		expect(exitCode).toBe(0);
		expect(fetchImpl).toHaveBeenCalledWith(
			"https://smoll-host.vercel.app/api/v1/sites",
			expect.any(Object)
		);
	});

	it("reports the unreachable API origin for network errors", async () => {
		const client = new SmollApiClient(
			"https://unreachable.test",
			"smoll_test",
			async () => {
				throw new TypeError("fetch failed");
			}
		);

		await expect(client.listSites()).rejects.toEqual(
			new SmollApiError(
				0,
				"NETWORK_ERROR",
				"Could not reach https://unreachable.test (fetch failed). Check your network or override the API origin with --api-url."
			)
		);
	});

	it("preserves structured API errors", async () => {
		const client = new SmollApiClient(
			"https://api.test",
			"smoll_test",
			async () =>
				jsonResponse(
					{
						ok: false,
						error: {
							code: "INVALID_API_KEY",
							message: "The API key is invalid",
							requestId: "request-123",
						},
					},
					{ status: 401 }
				)
		);

		await expect(client.listSites()).rejects.toEqual(
			new SmollApiError(401, "INVALID_API_KEY", "The API key is invalid", "request-123")
		);
	});
});

function jsonResponse(body: unknown, init?: ResponseInit) {
	return new Response(JSON.stringify(body), {
		...init,
		headers: {
			"Content-Type": "application/json",
			...init?.headers,
		},
	});
}
