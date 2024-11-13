import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: 'us-east-2' });
const S3_BUCKET = 'farmaloop-privados';

export const generateSignedUrl = async (fileKey: string): Promise<string> => {
  try {
    const parsedUrl = new URL(fileKey);
    const relativeKey = parsedUrl.pathname.replace(/^\/+/, '');

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: relativeKey,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3000 });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
};
