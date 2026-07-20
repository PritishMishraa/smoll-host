export interface ApiErrorBody {
	ok: false;
	error: {
		code: string;
		message: string;
		requestId?: string;
	};
}

export interface Site {
	id: string;
	name: string;
	url: string;
	createdAt: string;
	updatedAt: string;
	publishedAt: string | null;
}

export interface PublishResult {
	ok: true;
	created: boolean;
	bytes: number;
	sha256: string;
	site: Site;
}

export interface ListSitesResult {
	ok: true;
	sites: Site[];
}

export class SmollApiError extends Error {
	constructor(
		public readonly status: number,
		public readonly code: string,
		message: string,
		public readonly requestId?: string
	) {
		super(message);
		this.name = "SmollApiError";
	}
}

export class SmollApiClient {
	private readonly baseUrl: string;

	constructor(
		baseUrl: string,
		private readonly token: string,
		private readonly fetchImpl: typeof fetch = fetch
	) {
		this.baseUrl = baseUrl.replace(/\/+$/, "");
	}

	async publish(site: string, html: Uint8Array) {
		return this.request<PublishResult>(`/api/v1/sites/${encodeURIComponent(site)}`, {
			method: "PUT",
			headers: {
				"Content-Type": "text/html; charset=utf-8",
			},
			body: html,
		});
	}

	async listSites() {
		return this.request<ListSitesResult>("/api/v1/sites");
	}

	async getSite(site: string) {
		return this.request<{ ok: true; site: Site }>(
			`/api/v1/sites/${encodeURIComponent(site)}`
		);
	}

	async download(site: string) {
		const response = await this.fetchImpl(
			`${this.baseUrl}/api/v1/sites/${encodeURIComponent(site)}/content`,
			{
				headers: this.headers(),
			}
		);

		if (!response.ok) {
			await this.throwResponseError(response);
		}

		return new Uint8Array(await response.arrayBuffer());
	}

	async deleteSite(site: string) {
		return this.request<{ ok: true; deleted: string }>(
			`/api/v1/sites/${encodeURIComponent(site)}`,
			{ method: "DELETE" }
		);
	}

	private async request<T>(path: string, init: RequestInit = {}) {
		const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
			...init,
			headers: {
				...this.headers(),
				...init.headers,
			},
		});

		if (!response.ok) {
			await this.throwResponseError(response);
		}

		return (await response.json()) as T;
	}

	private headers() {
		return {
			Accept: "application/json",
			Authorization: `Bearer ${this.token}`,
			"User-Agent": "@smoll-host/cli/0.1.0",
		};
	}

	private async throwResponseError(response: Response): Promise<never> {
		const payload = (await response.json().catch(() => null)) as ApiErrorBody | null;
		const requestId =
			payload?.error?.requestId ?? response.headers.get("x-request-id") ?? undefined;

		throw new SmollApiError(
			response.status,
			payload?.error?.code ?? "HTTP_ERROR",
			payload?.error?.message ?? `Request failed with HTTP ${response.status}`,
			requestId
		);
	}
}
