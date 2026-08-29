import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  enabled: boolean;
}

const DEFAULT_CLOUD_NAME = 'jzepzwix';
const DEFAULT_UPLOAD_PRESET = 'bunny-gym-record';

export async function getCloudinaryConfig(): Promise<CloudinaryConfig> {
  try {
    const snap = await getDoc(doc(db, 'config', 'cloudinary'));
    if (snap.exists()) {
      const data = snap.data();
      return {
        cloudName: data.cloudName || DEFAULT_CLOUD_NAME,
        uploadPreset: data.uploadPreset || DEFAULT_UPLOAD_PRESET,
        enabled: Boolean((data.cloudName || DEFAULT_CLOUD_NAME) && (data.uploadPreset || DEFAULT_UPLOAD_PRESET))
      };
    }
  } catch (err) {
    console.error("Error loading Cloudinary config:", err);
  }
  return {
    cloudName: DEFAULT_CLOUD_NAME,
    uploadPreset: DEFAULT_UPLOAD_PRESET,
    enabled: true
  };
}

export async function saveCloudinaryConfig(config: CloudinaryConfig): Promise<void> {
  await setDoc(doc(db, 'config', 'cloudinary'), config);
}

/**
 * Uploads a file (video, audio, image) directly to Cloudinary using unsigned upload preset
 */
export function uploadToCloudinary(
  file: File,
  cloudName: string,
  uploadPreset: string,
  resourceType: 'auto' | 'video' | 'image' | 'raw' = 'auto',
  onProgress?: (progressPct: number) => void
): Promise<{ url: string; publicId: string; format: string }> {
  return new Promise((resolve, reject) => {
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    xhr.open('POST', url, true);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          onProgress(pct);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            url: response.secure_url || response.url,
            publicId: response.public_id,
            format: response.format
          });
        } catch (parseErr) {
          reject(new Error("Failed to parse Cloudinary response."));
        }
      } else {
        try {
          const errResp = JSON.parse(xhr.responseText);
          reject(new Error(errResp.error?.message || `Cloudinary upload failed with status ${xhr.status}`));
        } catch (e) {
          reject(new Error(`Cloudinary upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Network error during Cloudinary upload."));
    xhr.send(formData);
  });
}
