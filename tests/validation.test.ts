import { describe, expect, it } from "vitest";

import { domainNameSchema, htmlFileSchema } from "@/lib/validation";

describe("validation", () => {
	it("normalizes valid domain names", () => {
		expect(domainNameSchema.parse(" My-Site ")).toBe("my-site");
	});

	it("rejects invalid domain names", () => {
		expect(domainNameSchema.safeParse("-bad").success).toBe(false);
		expect(domainNameSchema.safeParse("bad_idea").success).toBe(false);
		expect(domainNameSchema.safeParse("bad.thing").success).toBe(false);
	});

	it("accepts small HTML files", () => {
		const file = new File(["<h1>hello</h1>"], "index.html", { type: "text/html" });

		expect(htmlFileSchema.parse(file)).toBe(file);
	});

	it("rejects non-HTML files", () => {
		const file = new File(["hello"], "notes.txt", { type: "text/plain" });

		expect(htmlFileSchema.safeParse(file).success).toBe(false);
	});
});
