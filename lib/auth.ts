import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { createSiteApiKeyPlugin } from "@/lib/api-key-options";
import { requireServerEnv } from "@/lib/runtime-config";

function createAuth() {
	return betterAuth({
		baseURL: requireServerEnv("BETTER_AUTH_URL"),
		secret: requireServerEnv("BETTER_AUTH_SECRET"),
		database: drizzleAdapter(getDb(), {
			provider: "pg",
			schema,
		}),
		socialProviders: {
			github: {
				clientId: requireServerEnv("GITHUB_CLIENT_ID"),
				clientSecret: requireServerEnv("GITHUB_CLIENT_SECRET"),
			},
		},
		plugins: [
			createSiteApiKeyPlugin(),
		],
	});
}

let authInstance: ReturnType<typeof createAuth> | null = null;

export function getAuth() {
	if (!authInstance) {
		authInstance = createAuth();
	}

	return authInstance;
}
