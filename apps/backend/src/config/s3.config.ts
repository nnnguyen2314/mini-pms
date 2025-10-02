import dotenv from 'dotenv';
import { S3Client } from '@aws-sdk/client-s3';

dotenv.config();

export interface S3Settings {
  provider: 'local' | 's3';
  region?: string;
  bucket?: string;
  publicUrlBase?: string; // e.g., https://my-bucket.s3.amazonaws.com or CloudFront domain
}

let s3ClientSingleton: S3Client | null = null;

export function getS3Settings(): S3Settings {
  const provider = (process.env.FILE_STORAGE_PROVIDER || 'local').toLowerCase() as 'local' | 's3';
  return {
    provider,
    region: process.env.AWS_REGION,
    bucket: process.env.S3_BUCKET,
    publicUrlBase: process.env.S3_PUBLIC_URL_BASE,
  };
}

export function getS3Client(): S3Client {
  if (!s3ClientSingleton) {
    const settings = getS3Settings();
    if (settings.provider !== 's3') {
      throw new Error('S3 client requested but FILE_STORAGE_PROVIDER is not set to "s3"');
    }
    s3ClientSingleton = new S3Client({
      region: settings.region,
      credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      } : undefined,
    });
  }
  return s3ClientSingleton;
}
