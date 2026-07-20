import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { getRuntimeConfigIssues } from "@/lib/runtime-config";
import { checkStorageConnection } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
	const configIssues = getRuntimeConfigIssues();
	const [database, storage] = await Promise.all([
		check("database", async () => {
			await getDb().execute(sql`select 1`);
		}),
		check("storage", checkStorageConnection),
	]);
	const ok = configIssues.length === 0 && database.ok && storage.ok;

	return NextResponse.json(
		{
			ok,
			checks: {
				config: {
					ok: configIssues.length === 0,
					issues: configIssues,
				},
				database,
				storage,
			},
		},
		{
			status: ok ? 200 : 503,
			headers: {
				"Cache-Control": "no-store",
			},
		}
	);
}

async function check(name: string, operation: () => Promise<void>) {
	try {
		await operation();
		return { ok: true };
	} catch (error) {
		const errorType = error instanceof Error ? error.name : typeof error;
		console.error(`Health check failed: ${name} (${errorType})`);
		return { ok: false };
	}
}
