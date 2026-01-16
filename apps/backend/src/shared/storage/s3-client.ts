import { S3Client } from '@aws-sdk/client-s3';

const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

let s3Instance: S3Client | null = null;

if (region && accessKeyId && secretAccessKey) {
  s3Instance = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
  console.log('✓ AWS S3 client initialized');
} else {
  console.warn('⚠ AWS credentials not found. Image upload features will be disabled.');
  console.warn('  Set AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY in .env to enable image uploads.');
}

export const s3Client = s3Instance;

export function ensureS3Client(): S3Client {
  if (!s3Client) {
    throw new Error(
      'AWS S3 is not configured. Please set AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY in .env'
    );
  }
  return s3Client;
}
