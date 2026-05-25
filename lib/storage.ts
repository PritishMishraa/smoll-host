import "server-only";

import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import type { Readable } from "node:stream";

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

export async function downloadDomainHtml(domainName: string) {
	try {
		const response = await s3.send(
			new GetObjectCommand({
				Bucket: getBucketName(),
				Key: getIndexKey(domainName),
			})
		);

		if (!response.Body) {
			throw new Error("HTML file not found");
		}

		return streamToBuffer(response.Body as Readable);
	} catch (error) {
		if (isMissingS3ObjectError(error)) {
			throw new Error("HTML file not found");
		}

		throw error;
	}
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

async function streamToBuffer(stream: Readable) {
	const chunks: Buffer[] = [];

	for await (const chunk of stream) {
		chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
	}

	return Buffer.concat(chunks);
}

function isMissingS3ObjectError(error: unknown) {
	if (!(error instanceof Error)) {
		return false;
	}

	return error.name === "NoSuchKey" || error.name === "NotFound" || error.message.includes("NoSuchKey");
}
