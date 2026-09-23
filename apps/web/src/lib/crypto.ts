// apps/web/src/lib/crypto.ts
// Real client-side AES-256-GCM encryption using the Web Crypto API.
// Nothing here ever leaves the browser unencrypted.

const PBKDF2_ITERATIONS = 250_000;

export async function deriveKey(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypts a File and returns a packed Uint8Array: [16-byte salt][12-byte IV][ciphertext+authTag]
// The plaintext payload includes an SV01 metadata header preserving original filename & MIME type.
export async function encryptFile(
  file: File,
  passphrase: string
): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const fileBuffer = await file.arrayBuffer();

  // Package with SV01 header so any recipient gets the exact original filename & mime type
  const metaStr = JSON.stringify({ name: file.name, type: file.type || 'application/octet-stream' });
  const metaBytes = new TextEncoder().encode(metaStr);
  const totalPlain = new Uint8Array(8 + metaBytes.length + fileBuffer.byteLength);
  // Magic: "SV01" [0x53, 0x56, 0x30, 0x31]
  totalPlain[0] = 0x53;
  totalPlain[1] = 0x56;
  totalPlain[2] = 0x30;
  totalPlain[3] = 0x31;
  new DataView(totalPlain.buffer).setUint32(4, metaBytes.length, false);
  totalPlain.set(metaBytes, 8);
  totalPlain.set(new Uint8Array(fileBuffer), 8 + metaBytes.length);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    totalPlain
  );
  const packed = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  packed.set(salt, 0);
  packed.set(iv, salt.length);
  packed.set(new Uint8Array(ciphertext), salt.length + iv.length);
  return packed;
}

// Pack ciphertext with embedded key (for "with key attached" stego sharing)
// Format:
// [0x53, 0x4B, 0x30, 0x31] (Magic: "SK01")
// [keyLen: uint16, 2 bytes]
// [keyBytes: UTF-8 encoded passphrase]
// [packedCiphertext bytes]
export function attachKeyToStegoPayload(
  packedCiphertext: Uint8Array,
  key: string
): Uint8Array {
  const enc = new TextEncoder();
  const keyBytes = enc.encode(key);
  const total = new Uint8Array(4 + 2 + keyBytes.length + packedCiphertext.length);
  // Magic: SK01
  total[0] = 0x53;
  total[1] = 0x4b;
  total[2] = 0x30;
  total[3] = 0x31;
  new DataView(total.buffer).setUint16(4, keyBytes.length, false);
  total.set(keyBytes, 6);
  total.set(packedCiphertext, 6 + keyBytes.length);
  return total;
}

// Inspect a stego payload to check if it has an attached key
export function unpackStegoPayload(
  payload: Uint8Array
): { packedCiphertext: Uint8Array; attachedKey: string | null } {
  if (
    payload.length >= 6 &&
    payload[0] === 0x53 &&
    payload[1] === 0x4b &&
    payload[2] === 0x30 &&
    payload[3] === 0x31
  ) {
    try {
      const keyLen = new DataView(payload.buffer, payload.byteOffset, payload.byteLength).getUint16(4, false);
      if (6 + keyLen <= payload.length) {
        const keyBytes = payload.slice(6, 6 + keyLen);
        const attachedKey = new TextDecoder().decode(keyBytes);
        const packedCiphertext = payload.slice(6 + keyLen);
        return { packedCiphertext, attachedKey };
      }
    } catch {
      // fallback
    }
  }
  return { packedCiphertext: payload, attachedKey: null };
}

// Reverses encryptFile(). Throws if the passphrase is wrong (GCM auth tag check fails).
// Unpacks SV01 metadata header if present, attaching filename & mimeType to the returned ArrayBuffer.
// If payload contains SK01 attached key, automatically uses it when passphrase is not explicitly supplied.
export async function decryptPacked(
  packed: Uint8Array,
  passphrase?: string
): Promise<ArrayBuffer> {
  const { packedCiphertext, attachedKey } = unpackStegoPayload(packed);
  const effectivePass = passphrase || attachedKey;
  if (!effectivePass) {
    throw new Error('No decryption passphrase provided and no key attached to container');
  }

  const salt = packedCiphertext.slice(0, 16);
  const iv = packedCiphertext.slice(16, 28);
  const ciphertext = packedCiphertext.slice(28);
  const key = await deriveKey(effectivePass, salt);
  const decryptedRaw = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext as BufferSource
  );

  const rawBytes = new Uint8Array(decryptedRaw);
  // Check for SV01 magic bytes [0x53, 0x56, 0x30, 0x31]
  if (
    rawBytes.length >= 8 &&
    rawBytes[0] === 0x53 &&
    rawBytes[1] === 0x56 &&
    rawBytes[2] === 0x30 &&
    rawBytes[3] === 0x31
  ) {
    try {
      const metaLen = new DataView(rawBytes.buffer, rawBytes.byteOffset, 8).getUint32(4, false);
      if (8 + metaLen <= rawBytes.length) {
        const metaStr = new TextDecoder().decode(rawBytes.slice(8, 8 + metaLen));
        const meta = JSON.parse(metaStr);
        const fileContent = decryptedRaw.slice(8 + metaLen);
        (fileContent as any).filename = meta.name;
        (fileContent as any).mimeType = meta.type;
        return fileContent;
      }
    } catch {}
  }

  return decryptedRaw;
}

// Helper: Convert Uint8Array to base64 for persistent storage
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Convert base64 back to Uint8Array
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Helper: Compute real SHA-256 hex string for audit logging & checksum verification
export async function computeSHA256(buffer: ArrayBuffer | Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
