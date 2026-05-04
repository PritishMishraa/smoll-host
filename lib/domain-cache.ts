import "server-only";

import { createClient, type RedisClientType } from "redis";

const DOMAIN_KEY_PREFIX = "domain:";

let client: RedisClientType | null = null;
let connectPromise: Promise<RedisClientType | null> | null = null;

async function getRedisClient() {
	if (!process.env.REDIS_URL) {
		return null;
	}

	if (client?.isOpen) {
		return client;
	}

	if (!connectPromise) {
		const redisUrl = process.env.REDIS_URL;
		const usesTls = redisUrl.startsWith("rediss://") || process.env.REDIS_TLS === "true";

		client = createClient({
			url: redisUrl,
			socket: {
				tls: usesTls ? true : undefined,
				reconnectStrategy: (retries) => {
					if (retries > 3) {
						return false;
					}

					return Math.min(retries * 100, 500);
				},
			},
		});

		client.on("error", (error) => {
			console.error("Redis Cloud error:", error);
		});

		connectPromise = client
			.connect()
			.then(() => client)
			.catch((error) => {
				console.error("Failed to connect to Redis Cloud:", error);
				client = null;
				connectPromise = null;
				return null;
			});
	}

	return connectPromise;
}

export async function isDomainCached(name: string) {
	const redis = await getRedisClient();

	if (!redis) {
		return false;
	}

	try {
		return Boolean(await redis.exists(getDomainKey(name)));
	} catch (error) {
		console.error("Failed to read domain cache:", error);
		return false;
	}
}

export async function cacheDomain(name: string, userId: string) {
	const redis = await getRedisClient();

	if (!redis) {
		return;
	}

	try {
		await redis.set(getDomainKey(name), userId);
	} catch (error) {
		console.error("Failed to write domain cache:", error);
	}
}

export async function uncacheDomain(name: string) {
	const redis = await getRedisClient();

	if (!redis) {
		return;
	}

	try {
		await redis.del(getDomainKey(name));
	} catch (error) {
		console.error("Failed to delete domain cache:", error);
	}
}

function getDomainKey(name: string) {
	return `${DOMAIN_KEY_PREFIX}${name}`;
}
