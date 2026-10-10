import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

// Configure Cloudinary with env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  thumbnailUrl: string;
  resourceType: string;
  format: string;
  bytes: number;
}

/**
 * Upload a document to Cloudinary
 * @param fileBuffer - The file buffer to upload
 * @param folder - The folder path in Cloudinary (e.g., `ainos-docs/${companyId}`)
 * @param publicId - A unique public ID for the file
 * @param resourceType - 'auto' lets Cloudinary detect, 'raw' for PDFs/docs, 'image' for images
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string,
  publicId: string,
  resourceType: 'auto' | 'image' | 'raw' | 'video' = 'auto'
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
        overwrite: false,
        // Generate thumbnail for images
        transformation: resourceType === 'image' ? [
          { width: 300, height: 400, crop: 'limit' },
        ] : undefined,
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error('Cloudinary upload returned no result'));
          return;
        }

        // For non-image resources, generate a thumbnail URL using image transformation
        const thumbnailUrl = result.resource_type === 'image'
          ? cloudinary.url(result.public_id, {
              transformation: [{ width: 300, height: 400, crop: 'limit' }],
              resource_type: result.resource_type,
            })
          : result.secure_url;

        resolve({
          publicId: result.public_id,
          url: result.secure_url,
          thumbnailUrl,
          resourceType: result.resource_type,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Delete a file from Cloudinary by its public ID
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'raw' | 'video' = 'raw'
): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      { resource_type: resourceType },
      (error, result) => {
        if (error) {
          console.error('Cloudinary delete error:', error);
          reject(error);
          return;
        }
        resolve();
      }
    );
  });
}

/**
 * Generate a preview URL for a document (useful for PDFs)
 * Cloudinary can render PDF pages as images
 */
export function getPreviewUrl(
  publicId: string,
  resourceType: string,
  options?: { width?: number; height?: number; page?: number }
): string {
  const { width = 800, height = 1000, page = 1 } = options || {};

  if (resourceType === 'raw' && publicId.endsWith('.pdf')) {
    // Convert PDF first page to image for preview
    return cloudinary.url(publicId.replace('.pdf', ''), {
      resource_type: 'image',
      transformation: [
        { page, width, height, crop: 'limit' },
        { format: 'png' },
      ],
    });
  }

  return cloudinary.url(publicId, {
    resource_type: resourceType as any,
    transformation: [{ width, height, crop: 'limit' }],
  });
}

/**
 * Get the Cloudinary instance for advanced operations
 */
export { cloudinary };
