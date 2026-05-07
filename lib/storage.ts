import "server-only";

import {
	DeleteObjectCommand,
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
	await s3.send(
		new DeleteObjectCommand({
			Bucket: getBucketName(),
			Key: getIndexKey(domainName),
		})
	);
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
