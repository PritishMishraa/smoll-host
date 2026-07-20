import "server-only";

import { getAuth } from "@/lib/auth";

export async function requireUserIdFromHeaders(headers: Headers) {
	const session = await getAuth().api.getSession({ headers });

	if (!session?.user?.id) {
		throw new Error("You must sign in before continuing");
	}

	return session.user.id;
}
