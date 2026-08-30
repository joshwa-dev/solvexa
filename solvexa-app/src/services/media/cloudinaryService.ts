/**
 * cloudinaryService.ts
 *
 * Handles all media uploads for Solvexa using Cloudinary's free tier.
 * Firebase Storage is intentionally NOT used — this project runs on the
 * Firebase Spark (free) plan which does not include Firebase Storage.
 *
 * Security model:
 * - Uses an UNSIGNED upload preset configured in the Cloudinary Dashboard
 * - API Secret is NEVER exposed in frontend code
 * - Only VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET are needed
 *
 * Setup:
 * 1. Create a free account at https://cloudinary.com
 * 2. In Settings → Upload → Upload Presets → Add Preset → Signing Mode: Unsigned
 * 3. Add to .env.local:
 *    VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
 *    VITE_CLOUDINARY_UPLOAD_PRESET=solvexa_uploads
 */

export interface CloudinaryUploadResult {
  /** The HTTPS URL to the uploaded media */
  secure_url: string;
  /** Cloudinary public_id for future management/deletion */
  public_id: string;
  resource_type: 'image' | 'video' | 'raw';
  format: string;
  width?: number;
  height?: number;
  /** Duration in seconds (videos only) */
  duration?: number;
  bytes: number;
}

export interface CloudinaryUploadOptions {
  /** The folder path inside your Cloudinary media library */
  folder?: string;
  /** Cloudinary transformation tag for optimization */
  tags?: string[];
}

export type UploadProgressCallback = (progress: number) => void;

const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];

/**
 * Validates a media file before upload.
 */
export function validateMediaFile(file: File): { valid: boolean; error?: string; type: 'image' | 'video' } {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type) || file.type.startsWith('image/');
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type) || file.type.startsWith('video/');

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: 'Please select a valid image (JPG, PNG, WebP, GIF) or video (MP4, WebM, MOV) file.',
      type: 'image',
    };
  }

  if (isImage && file.size > MAX_IMAGE_BYTES) {
    return { valid: false, error: 'Image file size must be less than 25 MB.', type: 'image' };
  }

  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    return { valid: false, error: 'Video file size must be less than 100 MB.', type: 'video' };
  }

  return { valid: true, type: isImage ? 'image' : 'video' };
}

/**
 * Returns an instant local preview URL using the browser's object URL API.
 * This is shown IMMEDIATELY before the upload completes.
 * Call URL.revokeObjectURL(url) when done to free memory.
 */
export function createLocalPreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Reads a file as a DataURL (base64). Use for small files or offline fallback.
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a media file to Cloudinary.
 *
 * @param file         The File to upload
 * @param folder       Cloudinary folder path e.g. 'solvexa/avatars'
 * @param onProgress   Optional progress callback (0-100)
 * @returns            CloudinaryUploadResult with secure_url and metadata
 * @throws             Error with a user-friendly message if upload fails
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = 'solvexa/uploads',
  onProgress?: UploadProgressCallback
): Promise<CloudinaryUploadResult> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Cloudinary is not configured. Please set VITE_CLOUDINARY_CLOUD_NAME and ' +
      'VITE_CLOUDINARY_UPLOAD_PRESET in your .env.local file.'
    );
  }

  const validation = validateMediaFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Use auto/upload endpoint for maximum compatibility with both images and videos
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);
  formData.append('resource_type', 'auto');

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const pct = Math.round((event.loaded / event.total) * 100);
        onProgress?.(pct);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText) as CloudinaryUploadResult;
          resolve(result);
        } catch {
          reject(new Error('Cloudinary returned an unexpected response. Please try again.'));
        }
      } else {
        let errorMessage = 'Media upload failed. Please check your connection and try again.';
        try {
          const errBody = JSON.parse(xhr.responseText) as { error?: { message?: string } };
          if (errBody.error?.message) {
            errorMessage = `Upload error: ${errBody.error.message}`;
          }
        } catch {
          // keep default message
        }
        console.error('[Cloudinary] Upload failed:', xhr.status, xhr.responseText);
        reject(new Error(errorMessage));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during media upload. Please check your connection and try again.'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Media upload was cancelled.'));
    });

    xhr.open('POST', uploadUrl);
    xhr.send(formData);
  });
}

/**
 * Convenience wrapper that resolves a Cloudinary folder based on content type.
 */
export async function uploadMedia(
  file: File,
  context: 'avatar' | 'cover' | 'post' | 'signal' | 'moment' | 'message' | 'space',
  uid: string,
  onProgress?: UploadProgressCallback
): Promise<CloudinaryUploadResult> {
  const folderMap: Record<string, string> = {
    avatar: `solvexa/users/${uid}/avatar`,
    cover: `solvexa/users/${uid}/cover`,
    post: `solvexa/users/${uid}/posts`,
    signal: `solvexa/users/${uid}/signals`,
    moment: `solvexa/users/${uid}/moments`,
    message: `solvexa/users/${uid}/messages`,
    space: `solvexa/spaces`,
  };

  const folder = folderMap[context] || `solvexa/users/${uid}/uploads`;
  return uploadToCloudinary(file, folder, onProgress);
}

/**
 * Derives a static JPEG thumbnail from a Cloudinary video URL.
 *
 * Cloudinary video poster frames are served under the /video/upload/ endpoint
 * (NOT /image/upload/, which returns 404 for video assets) with an image
 * transformation and .jpg extension:
 *
 * Example:
 *   Original: https://res.cloudinary.com/{cloud}/video/upload/v12345/solvexa/signals/my-video.mp4
 *   Poster:   https://res.cloudinary.com/{cloud}/video/upload/so_0.5,w_800,c_limit,f_jpg/v12345/solvexa/signals/my-video.jpg
 */
export function getCloudinaryVideoThumbnail(videoUrl: string | null | undefined): string | null {
  if (!videoUrl) return null;

  // If it's already an image URL (jpg, png, webp, etc.), return it directly
  if (/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(videoUrl)) {
    return videoUrl;
  }

  // Must be a Cloudinary res URL containing /video/upload/
  if (videoUrl.includes('res.cloudinary.com') && videoUrl.includes('/video/upload/')) {
    try {
      // In Cloudinary, a video frame poster is served under /video/upload/ with .jpg extension
      return videoUrl
        .replace('/video/upload/', '/video/upload/so_0.5,w_800,c_limit,f_jpg/')
        .replace(/\.(mp4|webm|mov|avi|mkv|m4v)(\?.*)?$/i, '.jpg');
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Returns the best available thumbnail URL for a signal.
 *
 * Priority:
 *  1. thumbnailUrl if it looks like an image URL (not a video extension)
 *  2. Cloudinary-derived poster from thumbnailUrl (if it was accidentally saved as .mp4)
 *  3. Cloudinary-derived poster from videoUrl
 *  4. videoUrl if it's already an image URL
 *  5. null (caller should show fallback UI)
 */
export function getSignalThumbnail(
  thumbnailUrl: string | null | undefined,
  videoUrl: string | null | undefined
): string | null {
  const isVideoExtension = (url: string) =>
    /\.(mp4|webm|mov|avi|mkv|m4v)(\?.*)?$/i.test(url);

  // 1. If thumbnailUrl exists and is a valid image (not a video extension), use it directly
  if (thumbnailUrl && !isVideoExtension(thumbnailUrl)) {
    return thumbnailUrl;
  }

  // 2. If thumbnailUrl is a video URL (from previous upload bug), derive a Cloudinary poster
  if (thumbnailUrl && isVideoExtension(thumbnailUrl)) {
    const derived = getCloudinaryVideoThumbnail(thumbnailUrl);
    if (derived) return derived;
  }

  // 3. Try to derive from videoUrl
  if (videoUrl) {
    if (!isVideoExtension(videoUrl)) {
      return videoUrl; // It's an image signal
    }
    const derived = getCloudinaryVideoThumbnail(videoUrl);
    if (derived) return derived;
  }

  return null;
}
