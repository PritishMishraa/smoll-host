import "server-only";

import {
	DeleteObjectsCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";

import { htmlFileSchema } from "@/lib/validation";

const s3 = new S3Client({
	region: process.env.AWS_REGION!,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	},
});

export async function uploadDomainHtml(domainName: string, file: File) {
	const parsedFile = htmlFileSchema.parse(file);
	const body = Buffer.from(await parsedFile.arrayBuffer());

	await s3.send(
		new PutObjectCommand({
			Bucket: getBucketName(),
			Key: getIndexKey(domainName),
			Body: body,
			ContentType: "text/html; charset=utf-8",
		})
	);
}

export async function deleteDomainFiles(domainName: string) {
	const bucket = getBucketName();
	const prefix = `${domainName}/`;
	let continuationToken: string | undefined;

	do {
		const listedObjects = await s3.send(
			new ListObjectsV2Command({
				Bucket: bucket,
				Prefix: prefix,
				ContinuationToken: continuationToken,
			})
		);

		const objects = listedObjects.Contents?.map((object) => ({ Key: object.Key })).filter(
			(object): object is { Key: string } => Boolean(object.Key)
		);

		if (objects?.length) {
			await s3.send(
				new DeleteObjectsCommand({
					Bucket: bucket,
					Delete: {
						Objects: objects,
						Quiet: true,
					},
				})
			);
		}

		continuationToken = listedObjects.NextContinuationToken;
	} while (continuationToken);
}

function getBucketName() {
	const bucketName = process.env.AWS_BUCKET_NAME;

	if (!bucketName) {
		throw new Error("AWS_BUCKET_NAME is required");
	}

	return bucketName;
}

function getIndexKey(domainName: string) {
	return `${domainName}/index.html`;
}
