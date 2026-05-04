import { describe, expect, it, vi } from "vitest";

import { createDomainWorkflows, type DomainWorkflowDependencies } from "@/lib/domain-workflows";

function createDependencies(overrides: Partial<DomainWorkflowDependencies> = {}) {
	const dependencies: DomainWorkflowDependencies = {
		findDomainByName: vi.fn(async () => undefined),
		insertDomain: vi.fn(async ({ name, userId }) => ({ id: "domain-id", name, userId })),
		findOwnedDomain: vi.fn(async ({ name, userId }) => ({ id: "domain-id", name, userId })),
		deleteDomainRecord: vi.fn(async () => true),
		cacheDomain: vi.fn(async () => undefined),
		uncacheDomain: vi.fn(async () => undefined),
		isDomainCached: vi.fn(async () => false),
		uploadHtml: vi.fn(async () => undefined),
		deleteFiles: vi.fn(async () => undefined),
		markPublished: vi.fn(async () => undefined),
		...overrides,
	};

	return dependencies;
}

describe("domain workflows", () => {
	it("rejects duplicate domains and backfills the cache", async () => {
		const dependencies = createDependencies({
			insertDomain: vi.fn(async () => undefined),
			findDomainByName: vi.fn(async () => ({
				id: "existing-domain",
				name: "taken",
				userId: "owner",
			})),
		});
		const workflows = createDomainWorkflows(dependencies);

		await expect(workflows.create("taken", "other-user")).rejects.toThrow("Domain is already taken");
		expect(dependencies.cacheDomain).toHaveBeenCalledWith("taken", "owner");
	});

	it("blocks upload when the user does not own the domain", async () => {
		const dependencies = createDependencies({
			findOwnedDomain: vi.fn(async () => undefined),
		});
		const workflows = createDomainWorkflows(dependencies);
		const file = new File(["<h1>hello</h1>"], "index.html", { type: "text/html" });

		await expect(workflows.upload("site", "wrong-user", file)).rejects.toThrow("Domain not found");
		expect(dependencies.uploadHtml).not.toHaveBeenCalled();
		expect(dependencies.markPublished).not.toHaveBeenCalled();
	});

	it("uploads and marks a domain as published after ownership passes", async () => {
		const dependencies = createDependencies();
		const workflows = createDomainWorkflows(dependencies);
		const file = new File(["<h1>hello</h1>"], "index.html", { type: "text/html" });

		await workflows.upload("site", "owner", file);

		expect(dependencies.uploadHtml).toHaveBeenCalledWith("site", file);
		expect(dependencies.markPublished).toHaveBeenCalledWith("site", "owner");
	});

	it("does not delete the database record when S3 prefix deletion fails", async () => {
		const dependencies = createDependencies({
			deleteFiles: vi.fn(async () => {
				throw new Error("S3 unavailable");
			}),
		});
		const workflows = createDomainWorkflows(dependencies);

		await expect(workflows.delete("site", "owner")).rejects.toThrow("S3 unavailable");
		expect(dependencies.deleteDomainRecord).not.toHaveBeenCalled();
		expect(dependencies.uncacheDomain).not.toHaveBeenCalled();
	});

	it("deletes files before the database record and cache", async () => {
		const calls: string[] = [];
		const dependencies = createDependencies({
			deleteFiles: vi.fn(async () => {
				calls.push("files");
			}),
			deleteDomainRecord: vi.fn(async () => {
				calls.push("database");
				return true;
			}),
			uncacheDomain: vi.fn(async () => {
				calls.push("cache");
			}),
		});
		const workflows = createDomainWorkflows(dependencies);

		await workflows.delete("site", "owner");

		expect(calls).toEqual(["files", "database", "cache"]);
	});
});
