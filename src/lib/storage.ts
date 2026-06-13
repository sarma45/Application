import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "./logger";

interface StorageConfig {
  endpoint: string;
  region: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  publicUrl: string;
}

function getConfig(): StorageConfig | null {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION || "us-east-1";
  const accessKey = process.env.S3_ACCESS_KEY;
  const secretKey = process.env.S3_SECRET_KEY;
  const bucket = process.env.S3_BUCKET || "aiverse";
  const publicUrl = process.env.S3_PUBLIC_URL || endpoint || "";

  if (!endpoint || !accessKey || !secretKey) return null;
  return { endpoint, region, accessKey, secretKey, bucket, publicUrl };
}

let s3Client: S3Client | null = null;

function getS3Client(config: StorageConfig): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: true,
    });
  }
  return s3Client;
}

export function resetS3Client(): void {
  s3Client = null;
}

export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string | null> {
  const config = getConfig();
  if (!config) {
    logger.warn("S3 not configured, skipping upload", { key });
    return null;
  }

  try {
    const client = getS3Client(config);
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );

    return `${config.publicUrl}/${config.bucket}/${key}`;
  } catch (err) {
    logger.error("S3 upload failed", { key, error: err });
    return null;
  }
}

export async function deleteFile(key: string): Promise<boolean> {
  const config = getConfig();
  if (!config) return false;

  try {
    const client = getS3Client(config);
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
      })
    );
    return true;
  } catch (err) {
    logger.error("S3 delete failed", { key, error: err });
    return false;
  }
}
