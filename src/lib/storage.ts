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
    const { S3Client, PutObjectCommand } = await import(
      "@aws-sdk/client-s3"
    );
    const client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: true,
    });

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
    const { S3Client, DeleteObjectCommand } = await import(
      "@aws-sdk/client-s3"
    );
    const client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: true,
    });

    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}
