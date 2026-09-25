// apps/web/src/lib/api.ts
// Direct client communication with StegaVault backend API.
// Strictly Zero-Knowledge: The backend only ever receives encrypted stego metadata
// and presigns S3 URLs. Plaintext files and secret keys NEVER touch the backend.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface RemoteVaultFile {
  id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface UploadUrlRequest {
  filename: string;
  mimeType?: string;
  sizeBytes?: number;
  ivHex?: string;
  authTagHex?: string;
  ciphertextSha256?: string;
}

export interface UploadUrlResponse {
  fileId: string;
  uploadUrl: string;
  s3KeyStego: string;
}

export interface DownloadUrlResponse {
  downloadUrl: string;
  filename: string;
  mimeType: string;
  iv: string;
  authTag: string;
  ciphertextSha256: string;
}

/**
 * Request a presigned S3 PUT URL for uploading an encrypted stego image.
 */
export async function requestUploadUrl(
  userEmail: string,
  payload: UploadUrlRequest
): Promise<UploadUrlResponse> {
  const res = await fetch(`${API_BASE_URL}/files/upload-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-email': userEmail,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to obtain upload URL' }));
    throw new Error(err.message || `Upload URL request failed with status ${res.status}`);
  }

  return res.json();
}

/**
 * Confirm with backend that the S3 PUT upload succeeded, activating the file.
 */
export async function confirmUpload(
  userEmail: string,
  fileId: string
): Promise<{ id: string; status: string; originalFilename: string }> {
  const res = await fetch(`${API_BASE_URL}/files/${fileId}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-email': userEmail,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to confirm upload' }));
    throw new Error(err.message || `Confirm upload failed with status ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch the authenticated user's remote vault files.
 */
export async function listFiles(userEmail: string): Promise<RemoteVaultFile[]> {
  const res = await fetch(`${API_BASE_URL}/files`, {
    method: 'GET',
    headers: {
      'x-user-email': userEmail,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to fetch vault files' }));
    throw new Error(err.message || `List files failed with status ${res.status}`);
  }

  return res.json();
}

/**
 * Request a presigned S3 GET URL to download a stego image.
 */
export async function requestDownloadUrl(
  userEmail: string,
  fileId: string
): Promise<DownloadUrlResponse> {
  const res = await fetch(`${API_BASE_URL}/files/${fileId}/download-url`, {
    method: 'GET',
    headers: {
      'x-user-email': userEmail,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to obtain download URL' }));
    throw new Error(err.message || `Download URL request failed with status ${res.status}`);
  }

  return res.json();
}

/**
 * Soft delete a file from the user's remote vault.
 */
export async function deleteFile(
  userEmail: string,
  fileId: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      'x-user-email': userEmail,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to delete file' }));
    throw new Error(err.message || `Delete file failed with status ${res.status}`);
  }

  return res.json();
}

/**
 * Completely resets and clears the user's remote vault (database records & S3 objects).
 */
export async function clearVault(
  userEmail: string,
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/files`, {
    method: 'DELETE',
    headers: {
      'x-user-email': userEmail,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to clear vault' }));
    throw new Error(err.message || `Clear vault failed with status ${res.status}`);
  }

  return res.json();
}

