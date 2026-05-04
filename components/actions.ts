"use server";

import { headers } from "next/headers";

import {
	createDomainForUser,
	deleteDomainForUser,
	isDomainAvailable,
	listDomainsForUser,
} from "@/lib/domains";
import { auth } from "@/lib/auth";

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
	const userId = await requireUserId();
	await deleteDomainForUser(value, userId);
}

async function requireUserId() {
	const session = await auth.api.getSession({
		headers: headers(),
	});

	if (!session?.user?.id) {
		throw new Error("You must sign in before continuing");
	}

	return session.user.id;
}
