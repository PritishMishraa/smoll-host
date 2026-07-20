import { apiKey } from "@better-auth/api-key";

const SITE_PERMISSIONS = {
	sites: ["read", "write", "delete"],
};

export function createSiteApiKeyPlugin() {
	return apiKey({
		defaultPrefix: "smoll_",
		requireName: true,
		keyExpiration: {
			defaultExpiresIn: 60 * 60 * 24 * 90,
			minExpiresIn: 1,
			maxExpiresIn: 365,
		},
		rateLimit: {
			enabled: true,
			timeWindow: 60 * 1000,
			maxRequests: 120,
		},
		permissions: {
			defaultPermissions: SITE_PERMISSIONS,
		},
	});
}
