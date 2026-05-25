import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db } from "@/db";
import { domain } from "@/db/schema";
import { cacheDomain, isDomainCached, uncacheDomain } from "@/lib/domain-cache";
import { createDomainWorkflows } from "@/lib/domain-workflows";
import { deleteDomainFiles, downloadDomainHtml, uploadDomainHtml } from "@/lib/storage";
import { domainNameSchema } from "@/lib/validation";

export async function isDomainAvailable(value: string) {
	const parsedDomain = domainNameSchema.safeParse(value);
	if (!parsedDomain.success) {
		return false;
	}

	return domainWorkflows.isAvailable(parsedDomain.data);
}

export async function createDomainForUser(value: string, userId: string) {
	const parsedDomain = domainNameSchema.parse(value);

	return domainWorkflows.create(parsedDomain, userId);
}

export async function listDomainsForUser(userId: string) {
	return db
		.select({
			id: domain.id,
			name: domain.name,
			createdAt: domain.createdAt,
			updatedAt: domain.updatedAt,
			publishedAt: domain.publishedAt,
		})
		.from(domain)
		.where(eq(domain.userId, userId))
		.orderBy(desc(domain.updatedAt));
}

export async function uploadHtmlForDomain(value: string, userId: string, file: File) {
	const parsedDomain = domainNameSchema.parse(value);
	await domainWorkflows.upload(parsedDomain, userId, file);
}

export async function downloadHtmlForDomain(value: string, userId: string) {
	const parsedDomain = domainNameSchema.parse(value);
	await requireOwnedDomain(parsedDomain, userId);

	return downloadDomainHtml(parsedDomain);
}

export async function markDomainPublishedForUser(value: string, userId: string) {
	const parsedDomain = domainNameSchema.parse(value);
	const now = new Date();

	await db
		.update(domain)
		.set({
			updatedAt: now,
			publishedAt: now,
		})
		.where(and(eq(domain.name, parsedDomain), eq(domain.userId, userId)));
}

export async function deleteDomainForUser(value: string, userId: string) {
	const parsedDomain = domainNameSchema.parse(value);
	await domainWorkflows.delete(parsedDomain, userId);
}

export async function requireOwnedDomain(name: string, userId: string) {
	const [ownedDomain] = await db
		.select({ id: domain.id, name: domain.name, userId: domain.userId })
		.from(domain)
		.where(and(eq(domain.name, name), eq(domain.userId, userId)))
		.limit(1);

	if (!ownedDomain) {
		throw new Error("Domain not found");
	}

	return ownedDomain;
}

async function findDomainByName(name: string) {
	const [existingDomain] = await db
		.select({ id: domain.id, name: domain.name, userId: domain.userId })
		.from(domain)
		.where(eq(domain.name, name))
		.limit(1);

	return existingDomain;
}

const domainWorkflows = createDomainWorkflows({
	findDomainByName,
	insertDomain: async ({ name, userId }) => {
		const now = new Date();
		const [insertedDomain] = await db
			.insert(domain)
			.values({
				id: randomUUID(),
				name,
				userId,
				createdAt: now,
				updatedAt: now,
				publishedAt: null,
			})
			.onConflictDoNothing()
			.returning({ id: domain.id, name: domain.name, userId: domain.userId });

		return insertedDomain;
	},
	findOwnedDomain: async ({ name, userId }) => requireOwnedDomain(name, userId),
	deleteDomainRecord: async ({ name, userId }) => {
		const deletedDomains = await db
			.delete(domain)
			.where(and(eq(domain.name, name), eq(domain.userId, userId)))
			.returning({ id: domain.id });

		return Boolean(deletedDomains[0]);
	},
	cacheDomain,
	uncacheDomain,
	isDomainCached,
	uploadHtml: uploadDomainHtml,
	deleteFiles: deleteDomainFiles,
	markPublished: markDomainPublishedForUser,
});
