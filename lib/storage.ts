import "server-only";

import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadBucketCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import type { Readable } from "node:stream";

import { htmlFileSchema } from "@/lib/validation";

let s3: S3Client | null = null;

export async function uploadDomainHtml(domainName: string, file: File) {
	const parsedFile = htmlFileSchema.parse(file);
	const body = Buffer.from(await parsedFile.arrayBuffer());

	await getS3Client().send(
		new PutObjectCommand({
			Bucket: getBucketName(),
			Key: getIndexKey(domainName),
			Body: body,
			ContentType: "text/html; charset=utf-8",
		})
	);
}

export async function deleteDomainFiles(domainName: string) {
	await getS3Client().send(
		new DeleteObjectCommand({
			Bucket: getBucketName(),
			Key: getIndexKey(domainName),
		})
	);
}

export async function downloadDomainHtml(domainName: string) {
	try {
		const response = await getS3Client().send(
			new GetObjectCommand({
				Bucket: getBucketName(),
				Key: getIndexKey(domainName),
			})
		);

		if (!response.Body) {
			throw new HtmlNotFoundError();
		}

		return streamToBuffer(response.Body as Readable);
	} catch (error) {
		if (isMissingS3ObjectError(error)) {
			throw new HtmlNotFoundError();
		}

		throw error;
	}
}

export async function checkStorageConnection() {
	await getS3Client().send(
		new HeadBucketCommand({
			Bucket: getBucketName(),
		})
	);
}

export class HtmlNotFoundError extends Error {
	constructor() {
		super("HTML file not found");
		this.name = "HtmlNotFoundError";
	}
}

function getBucketName() {
	const bucketName = process.env.AWS_BUCKET_NAME;

	if (!bucketName) {
		throw new Error("AWS_BUCKET_NAME is required");
	}

	return bucketName;
}

function getS3Client() {
	if (s3) {
		return s3;
	}

	const region = process.env.AWS_REGION;
	const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
	const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

	if (!region) {
		throw new Error("AWS_REGION is required");
	}

	if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
		throw new Error("AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be configured together");
	}

	s3 = new S3Client({
		region,
		...(accessKeyId && secretAccessKey
			? {
					credentials: {
						accessKeyId,
						secretAccessKey,
					},
				}
			: {}),
	});

	return s3;
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
