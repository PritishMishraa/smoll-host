import "server-only";

import { auth } from "@/lib/auth";

export async function requireUserIdFromHeaders(headers: Headers) {
	const session = await auth.api.getSession({ headers });

	if (!session?.user?.id) {
		throw new Error("You must sign in before continuing");
	}

	return session.user.id;
}
