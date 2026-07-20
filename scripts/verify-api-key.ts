import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import * as schema from "@/db/schema";
import { createSiteApiKeyPlugin } from "@/lib/api-key-options";

config({ path: [".env.local", ".env"] });

process.env.BETTER_AUTH_SECRET ??=
	"local-api-key-verification-secret-that-is-not-for-production";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";

async function verifyApiKeyLifecycle() {
	const [{ getDb }, { apikey, user }] = await Promise.all([
		import("@/db"),
		import("@/db/schema"),
	]);
	const db = getDb();
	const auth = betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",
			schema,
		}),
		plugins: [createSiteApiKeyPlugin()],
	});
	const userId = randomUUID();
	const email = `api-key-smoke-${userId}@example.invalid`;

	await db.insert(user).values({
		id: userId,
		name: "API key smoke test",
		email,
		emailVerified: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	try {
		const created = await auth.api.createApiKey({
			body: {
				name: "Production readiness smoke test",
				userId,
				expiresIn: 60 * 60 * 24,
				permissions: {
					sites: ["read", "write"],
				},
				rateLimitEnabled: false,
			},
		});
		const validWrite = await auth.api.verifyApiKey({
			body: {
				key: created.key,
				permissions: {
					sites: ["write"],
				},
			},
		});
		const invalidDelete = await auth.api.verifyApiKey({
			body: {
				key: created.key,
				permissions: {
					sites: ["delete"],
				},
			},
		});
		const [stored] = await db
			.select({
				key: apikey.key,
				referenceId: apikey.referenceId,
			})
			.from(apikey)
			.where(eq(apikey.id, created.id))
			.limit(1);

		if (!created.key.startsWith("smoll_")) {
			throw new Error("API key prefix verification failed");
		}

		if (!validWrite.valid || validWrite.key?.referenceId !== userId) {
			throw new Error("API key write permission verification failed");
		}

		if (invalidDelete.valid) {
			throw new Error("API key delete permission should have been denied");
		}

		if (!stored || stored.referenceId !== userId || stored.key === created.key) {
			throw new Error("API key hashing verification failed");
		}

		console.log(
			JSON.stringify({
				ok: true,
				created: true,
				hashedAtRest: true,
				writePermissionAccepted: true,
				deletePermissionDenied: true,
				cleanup: "pending",
			})
		);
	} finally {
		await db.delete(apikey).where(eq(apikey.referenceId, userId));
		await db.delete(user).where(eq(user.id, userId));
	}
}

verifyApiKeyLifecycle()
	.then(() => {
		console.log(JSON.stringify({ ok: true, cleanup: "complete" }));
	})
	.catch((error) => {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
	});
