"use server";

import { redis } from "@/lib/redis";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})

export async function getSignedURL(domainValue: string) {
    const putObjectCommand = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: `${domainValue}/index.html`,
    })

    const signedUrl = await getSignedUrl(s3, putObjectCommand, { expiresIn: 3600 })

    return { success: { url: signedUrl } }
}

export async function checkDomain(value: string) {
    const domainExists = await redis.get(value);
    if (domainExists) {
        return false;
    } else {
        return true;
    }
}