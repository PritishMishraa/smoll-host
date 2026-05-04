export interface DomainRecord {
	id: string;
	name: string;
	userId: string;
}

export interface DomainWorkflowDependencies {
	findDomainByName(name: string): Promise<DomainRecord | undefined>;
	insertDomain(input: { name: string; userId: string }): Promise<DomainRecord | undefined>;
	findOwnedDomain(input: { name: string; userId: string }): Promise<DomainRecord | undefined>;
	deleteDomainRecord(input: { name: string; userId: string }): Promise<boolean>;
	cacheDomain(name: string, userId: string): Promise<void>;
	uncacheDomain(name: string): Promise<void>;
	isDomainCached(name: string): Promise<boolean>;
	uploadHtml(name: string, file: File): Promise<void>;
	deleteFiles(name: string): Promise<void>;
	markPublished(name: string, userId: string): Promise<void>;
}

export function createDomainWorkflows(dependencies: DomainWorkflowDependencies) {
	return {
		async isAvailable(name: string) {
			if (await dependencies.isDomainCached(name)) {
				return false;
			}

			const existingDomain = await dependencies.findDomainByName(name);
			if (!existingDomain) {
				return true;
			}

			await dependencies.cacheDomain(name, existingDomain.userId);
			return false;
		},

		async create(name: string, userId: string) {
			const insertedDomain = await dependencies.insertDomain({ name, userId });

			if (!insertedDomain) {
				const existingDomain = await dependencies.findDomainByName(name);
				if (existingDomain) {
					await dependencies.cacheDomain(name, existingDomain.userId);
				}
				throw new Error("Domain is already taken");
			}

			await dependencies.cacheDomain(name, userId);
			return insertedDomain;
		},

		async upload(name: string, userId: string, file: File) {
			await requireOwnedDomain(dependencies, name, userId);
			await dependencies.uploadHtml(name, file);
			await dependencies.markPublished(name, userId);
		},

		async delete(name: string, userId: string) {
			await requireOwnedDomain(dependencies, name, userId);
			await dependencies.deleteFiles(name);

			const deleted = await dependencies.deleteDomainRecord({ name, userId });
			if (!deleted) {
				throw new Error("Domain not found");
			}

			await dependencies.uncacheDomain(name);
		},
	};
}

async function requireOwnedDomain(
	dependencies: DomainWorkflowDependencies,
	name: string,
	userId: string
) {
	const ownedDomain = await dependencies.findOwnedDomain({ name, userId });

	if (!ownedDomain) {
		throw new Error("Domain not found");
	}

	return ownedDomain;
}
