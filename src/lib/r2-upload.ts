// ponytail: Direct POST to Worker, no presigned URLs (avoids CORS issues)
// Worker proxies to R2 with proper CORS headers

import { ALLOWED_TYPES, MAX_SIZE_MB, MAX_SIZE_BYTES } from './upload-config';

export interface R2UploadOptions {
  onProgress?: (percent: number) => void;
  folder?: string; // events, projects, blogs, etc.
}

export interface R2UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

/**
 * Upload file to R2 via Worker proxy
 */
export async function uploadToR2(
  file: File,
  options: R2UploadOptions = {}
): Promise<R2UploadResult> {
  try {
    // ponytail: validation extracted to single function
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Upload to Worker endpoint with progress tracking
    const xhr = new XMLHttpRequest();
    
    const uploadPromise = new Promise<{ url: string; key: string }>((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && options.onProgress) {
          options.onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.url) {
              resolve({ url: response.url, key: response.key });
            } else {
              reject(new Error(response.error || 'No URL in response'));
            }
          } catch (err) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          try {
            const response = JSON.parse(xhr.responseText);
            reject(new Error(response.error || `Upload failed (${xhr.status})`));
          } catch {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        }
      });
      
      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

      const folderParam = options.folder ? `&folder=${encodeURIComponent(options.folder)}` : '';
      const url = `/upload?filename=${encodeURIComponent(file.name)}${folderParam}`;
      xhr.open('POST', url);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });

    const { url, key } = await uploadPromise;
    return { success: true, url, key };

  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Upload failed' };
  }
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) {
    return { valid: false, error: `File type ${file.type} not supported` };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: `File must be under ${MAX_SIZE_MB}MB` };
  }
  return { valid: true };
}
