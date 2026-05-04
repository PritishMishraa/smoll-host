import { z } from "zod";

export const domainNameSchema = z
	.string()
	.trim()
	.toLowerCase()
	.min(1, "Domain name is required")
	.max(63, "Domain name must be 63 characters or less")
	.regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/, {
		message: "Use lowercase letters, numbers, and hyphens only",
	});

export const MAX_HTML_FILE_SIZE = 16 * 1024 * 1024;

export const htmlFileSchema = z
	.instanceof(File)
	.refine((file) => file.size > 0, "HTML file cannot be empty")
	.refine((file) => file.size <= MAX_HTML_FILE_SIZE, "HTML file must be 16 MB or smaller")
	.refine((file) => {
		const name = file.name.toLowerCase();
		return name.endsWith(".html") || name.endsWith(".htm");
	}, "Only .html and .htm files are supported")
	.refine((file) => {
		return !file.type || file.type === "text/html";
	}, "Only text/html files are supported");
