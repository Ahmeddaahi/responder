import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// Cloudflare R2 configuration
const accountId = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = import.meta.env.VITE_CLOUDFLARE_ACCESS_KEY_ID;
const secretAccessKey = import.meta.env.VITE_CLOUDFLARE_SECRET_ACCESS_KEY;
const bucketName = import.meta.env.VITE_CLOUDFLARE_BUCKET_NAME;
const publicUrl = import.meta.env.VITE_CLOUDFLARE_PUBLIC_URL;

// Create S3-compatible client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
});

/**
 * Upload a file to Cloudflare R2
 * @param file - The file to upload
 * @param filePath - The path where the file should be stored (e.g., "userId/timestamp.ext")
 * @returns The public URL of the uploaded file
 */
export const uploadToCloudflare = async (
  file: File,
  filePath: string
): Promise<string> => {
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error('Cloudflare R2 credentials are not configured. Please check your environment variables.');
  }

  try {
    // Convert file to ArrayBuffer/Uint8Array for browser compatibility
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath,
      Body: uint8Array,
      ContentType: file.type || 'application/octet-stream',
      // Make the object publicly accessible
      ACL: 'public-read',
    });

    await s3Client.send(command);

    // Construct public URL
    // If custom public URL is provided, use it; otherwise construct from bucket name
    const url = publicUrl 
      ? `${publicUrl}/${filePath}`
      : `https://pub-${accountId}.r2.dev/${filePath}`;

    return url;
  } catch (error: any) {
    console.error('Cloudflare R2 upload error:', error);
    throw new Error(`Failed to upload to Cloudflare: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Check if a URL is from Cloudflare R2
 */
export const isCloudflareUrl = (url: string | null): boolean => {
  if (!url) return false;
  return url.includes('r2.dev') || url.includes('r2.cloudflarestorage.com') || url.includes('cloudflare');
};

/**
 * Check if a URL is from Supabase Storage
 */
export const isSupabaseUrl = (url: string | null): boolean => {
  if (!url) return false;
  return url.includes('supabase.co') && url.includes('storage');
};

