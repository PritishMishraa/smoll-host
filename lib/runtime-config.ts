import "server-only";

const REQUIRED_SERVER_ENV = [
	"BETTER_AUTH_SECRET",
	"BETTER_AUTH_URL",
	"GITHUB_CLIENT_ID",
	"GITHUB_CLIENT_SECRET",
	"AWS_BUCKET_NAME",
	"AWS_REGION",
] as const;

export function getRuntimeConfigIssues() {
	const missing = REQUIRED_SERVER_ENV.filter((name) => !process.env[name]?.trim());
	const secret = process.env.BETTER_AUTH_SECRET;

	if (secret && secret.length < 32) {
		return [...missing, "BETTER_AUTH_SECRET must contain at least 32 characters"];
	}

	const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
	const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

	if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
		return [...missing, "AWS access key ID and secret must be configured together"];
	}

	return missing;
}

export function requireServerEnv(name: (typeof REQUIRED_SERVER_ENV)[number]) {
	const value = process.env[name]?.trim();

	if (!value) {
		throw new Error(`${name} is required`);
	}

	return value;
}
