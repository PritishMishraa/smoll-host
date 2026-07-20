"use server";

import { headers } from "next/headers";

import {
	createDomainForUser,
	deleteDomainForUser,
	isDomainAvailable,
	listDomainsForUser,
} from "@/lib/domains";
import { getAuth } from "@/lib/auth";

export async function checkDomain(value: string) {
	return isDomainAvailable(value);
}

export async function createDomain(value: string) {
	const userId = await requireUserId();
	return createDomainForUser(value, userId);
}

export async function listDomains() {
	const userId = await requireUserId();
	return listDomainsForUser(userId);
}

export async function deleteDomain(value: string) {
	try {
		const userId = await requireUserId();
		await deleteDomainForUser(value, userId);
		return { ok: true as const };
	} catch (error) {
		console.error("Failed to delete domain:", error);

		return {
			ok: false as const,
			error: getActionErrorMessage(error, "Failed to delete domain"),
		};
	}
}

async function requireUserId() {
	const session = await getAuth().api.getSession({
		headers: headers(),
	});

	if (!session?.user?.id) {
		throw new Error("You must sign in before continuing");
	}

	return session.user.id;
}

function getActionErrorMessage(error: unknown, fallback: string) {
	if (!(error instanceof Error)) {
		return fallback;
	}

	if (error.message.includes("sign in") || error.message.includes("not found")) {
		return error.message;
	}

	return fallback;
}
