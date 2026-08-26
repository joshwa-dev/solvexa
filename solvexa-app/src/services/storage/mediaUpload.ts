/**
 * mediaUpload.ts
 *
 * Public-facing media upload API for all Solvexa features.
 * Routes all uploads through Cloudinary (not Firebase Storage).
 *
 * Firebase Storage is intentionally NOT used — the project is on the
 * Firebase Spark (free) plan which does not include Storage.
 */
import {
  uploadToCloudinary,
  validateMediaFile,
  readFileAsDataURL,
  createLocalPreview,
  type CloudinaryUploadResult,
} from '../media/cloudinaryService';
import { isFirebaseConfigured } from '../firebase/config';

export type { CloudinaryUploadResult };
export { validateMediaFile, readFileAsDataURL, createLocalPreview };

export interface UploadedMedia {
  url: string;
  type: 'image' | 'video';
  name: string;
  size: number;
  /** Cloudinary public_id for future deletion / management */
  publicId?: string;
}

export interface UploadProgressCallback {
  (progress: number, state: 'uploading' | 'success' | 'error', error?: string): void;
}

/**
 * Uploads a media file using Cloudinary.
 * Falls back to a local DataURL only when Cloudinary is NOT configured
 * (i.e. VITE_CLOUDINARY_CLOUD_NAME is missing), which is a dev-only path.
 *
 * @param file      The File selected by the user
 * @param folder    Content-type folder: 'posts' | 'moments' | 'signals' | 'messages' | 'avatars'
 * @param onProgress Optional progress callback
 */
export async function uploadMediaFile(
  file: File,
  folder: 'posts' | 'moments' | 'signals' | 'messages' | 'avatars' | 'covers' = 'posts',
  onProgress?: UploadProgressCallback
): Promise<UploadedMedia> {
  const validation = validateMediaFile(file);
  if (!validation.valid) {
    onProgress?.(0, 'error', validation.error);
    throw new Error(validation.error);
  }

  const mediaType = validation.type;
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const cloudinaryConfigured = Boolean(cloudName && cloudName.length > 0);

  // --- Cloudinary Upload Path (production) ---
  if (cloudinaryConfigured && isFirebaseConfigured) {
    try {
      onProgress?.(5, 'uploading');

      const cloudinaryFolder = `solvexa/${folder}`;
      const result = await uploadToCloudinary(file, cloudinaryFolder, (pct) => {
        onProgress?.(Math.max(5, pct), 'uploading');
      });

      onProgress?.(100, 'success');
      return {
        url: result.secure_url,
        type: mediaType,
        name: file.name,
        size: file.size,
        publicId: result.public_id,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Upload failed';
      console.error('[Solvexa] Cloudinary upload error:', error);
      onProgress?.(0, 'error', msg);
      throw new Error(msg);
    }
  }

  // --- Local DataURL fallback (dev / Cloudinary not yet configured) ---
  // This is intentionally visible in console to remind developers to configure Cloudinary.
  if (import.meta.env.DEV) {
    console.warn(
      '[Solvexa] Cloudinary is not configured. Using local DataURL fallback for development.\n' +
      'Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to .env.local\n' +
      'See SOLVEXA_FIREBASE_CLOUDINARY_SETUP.md for instructions.'
    );
  }

  onProgress?.(25, 'uploading');
  const dataUrl = await readFileAsDataURL(file);
  onProgress?.(100, 'success');
  return {
    url: dataUrl,
    type: mediaType,
    name: file.name,
    size: file.size,
  };
}

