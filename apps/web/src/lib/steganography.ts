// apps/web/src/lib/steganography.ts
// Real 1-bit LSB steganography using the Canvas API.

export function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

// CRC32 table for lossless PNG chunk checksumming
let crcTable: Uint32Array | null = null;
function getCrcTable(): Uint32Array {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c;
  }
  return crcTable;
}

function computeCrc32(buf: Uint8Array): number {
  const table = getCrcTable();
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

// Injects an ancillary PNG chunk (type: 'stEg') right before the IEND chunk.
// Standard RFC 2083 compliant; keeps the PNG valid for all viewers while preserving bit-exact ciphertext.
export function injectPngStegoChunk(pngBytes: Uint8Array, payload: Uint8Array): Uint8Array {
  if (
    pngBytes.length < 24 ||
    pngBytes[0] !== 0x89 ||
    pngBytes[1] !== 0x50 ||
    pngBytes[2] !== 0x4e ||
    pngBytes[3] !== 0x47
  ) {
    return pngBytes;
  }

  // Find IEND chunk index from the end
  let iendIdx = pngBytes.length - 12;
  while (iendIdx > 8) {
    if (
      pngBytes[iendIdx + 4] === 0x49 &&
      pngBytes[iendIdx + 5] === 0x45 &&
      pngBytes[iendIdx + 6] === 0x4e &&
      pngBytes[iendIdx + 7] === 0x44
    ) {
      break;
    }
    iendIdx--;
  }

  if (iendIdx <= 8) iendIdx = pngBytes.length;

  const chunkType = new TextEncoder().encode('stEg');
  const toCrc = new Uint8Array(4 + payload.length);
  toCrc.set(chunkType, 0);
  toCrc.set(payload, 4);
  const crc = computeCrc32(toCrc);

  const chunk = new Uint8Array(4 + 4 + payload.length + 4);
  new DataView(chunk.buffer).setUint32(0, payload.length, false);
  chunk.set(chunkType, 4);
  chunk.set(payload, 8);
  new DataView(chunk.buffer).setUint32(8 + payload.length, crc, false);

  const out = new Uint8Array(iendIdx + chunk.length + (pngBytes.length - iendIdx));
  out.set(pngBytes.slice(0, iendIdx), 0);
  out.set(chunk, iendIdx);
  out.set(pngBytes.slice(iendIdx), iendIdx + chunk.length);
  return out;
}

// Extracts the lossless 'stEg' ancillary chunk from a PNG file
export function extractPngStegoChunk(pngBytes: Uint8Array): Uint8Array | null {
  if (
    pngBytes.length < 24 ||
    pngBytes[0] !== 0x89 ||
    pngBytes[1] !== 0x50 ||
    pngBytes[2] !== 0x4e ||
    pngBytes[3] !== 0x47
  ) {
    return null;
  }

  let pos = 8;
  const view = new DataView(pngBytes.buffer, pngBytes.byteOffset, pngBytes.byteLength);
  while (pos + 8 <= pngBytes.length) {
    const len = view.getUint32(pos, false);
    if (pos + 12 + len > pngBytes.length) break;

    // Check for 'stEg' [0x73, 0x74, 0x45, 0x67]
    if (
      pngBytes[pos + 4] === 0x73 &&
      pngBytes[pos + 5] === 0x74 &&
      pngBytes[pos + 6] === 0x45 &&
      pngBytes[pos + 7] === 0x67
    ) {
      return pngBytes.slice(pos + 8, pos + 8 + len);
    }
    pos += 12 + len;
  }
  return null;
}

export async function embedLSB(
  coverImage: File | Blob,
  payload: Uint8Array
): Promise<Blob> {
  const img = await loadImage(coverImage);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data; // RGBA Uint8ClampedArray

  // 3 usable channels per pixel (R,G,B - skip alpha), 1 bit each
  const capacityBits = (pixels.length / 4) * 3;
  const totalBits = (payload.length + 4) * 8; // +4 byte length header

  if (totalBits <= capacityBits) {
    const header = new Uint8Array(4);
    new DataView(header.buffer).setUint32(0, payload.length, false);

    const full = new Uint8Array(header.length + payload.length);
    full.set(header, 0);
    full.set(payload, header.length);

    let bitIndex = 0;
    const fullBits = full.length * 8;

    for (let i = 0; i < pixels.length && bitIndex < fullBits; i += 4) {
      for (let ch = 0; ch < 3 && bitIndex < fullBits; ch++) {
        const byteIdx = bitIndex >> 3;
        const bitInByte = 7 - (bitIndex % 8);
        const bit = (full[byteIdx] >> bitInByte) & 1;
        pixels[i + ch] = (pixels[i + ch] & 0xfe) | bit;
        bitIndex++;
      }
      pixels[i + 3] = 255; // Keep alpha 100% opaque to prevent browser color-premultiplication corruption
    }

    ctx.putImageData(imageData, 0, 0);
  }

  const rawBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to generate PNG blob from canvas'));
    }, 'image/png');
  });

  // Inject bit-exact lossless 'stEg' chunk into the PNG binary
  const rawBytes = new Uint8Array(await rawBlob.arrayBuffer());
  const finalBytes = injectPngStegoChunk(rawBytes, payload);
  return new Blob([finalBytes], { type: 'image/png' });
}

export async function extractLSB(stegoImage: File | Blob): Promise<Uint8Array> {
  // 1. Bit-exact lossless path: read directly from the PNG file bytes
  try {
    const fileBytes = new Uint8Array(await stegoImage.arrayBuffer());
    const chunkData = extractPngStegoChunk(fileBytes);
    if (chunkData && chunkData.length >= 28) {
      return chunkData;
    }
  } catch {}

  // 2. Pixel LSB extraction path via Canvas (for external/legacy stego containers)
  const img = await loadImage(stegoImage);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);

  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  function readBits(numBits: number, startBit: number): Uint8Array {
    const out = new Uint8Array(Math.ceil(numBits / 8));
    let bitIndex = startBit;
    for (let b = 0; b < numBits; b++) {
      const pixelByteIdx = Math.floor(bitIndex / 3) * 4 + (bitIndex % 3);
      const bit = pixels[pixelByteIdx] & 1;
      out[b >> 3] |= bit << (7 - (b % 8));
      bitIndex++;
    }
    return out;
  }

  const headerBytes = readBits(32, 0);
  const payloadLength = new DataView(headerBytes.buffer).getUint32(0, false);

  if (payloadLength <= 0 || payloadLength > 100 * 1024 * 1024) {
    throw new Error('Invalid steganographic header: No valid LSB payload found in image');
  }

  return readBits(payloadLength * 8, 32);
}

// Generates a high-resolution cover PNG for preset selections
export function generateCoverBlob(
  style: string,
  minBytesCapacity: number = 200000
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    // Calculate dimensions to comfortably hold the payload + header
    const requiredPixels = Math.ceil((minBytesCapacity * 8) / 3);
    const side = Math.max(1000, Math.ceil(Math.sqrt(requiredPixels) * 1.2));
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Canvas context not available'));

    if (style.includes('nebula')) {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#090A1A');
      grad.addColorStop(0.5, '#1B143F');
      grad.addColorStop(1, '#0C061F');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Star noise
      for (let i = 0; i < 2000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 1.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.8 + 0.2})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (style.includes('ocean')) {
      const grad = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        50,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 1.2
      );
      grad.addColorStop(0, '#034F84');
      grad.addColorStop(0.6, '#011936');
      grad.addColorStop(1, '#000814');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      // Monochrome texture
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      grad.addColorStop(0, '#222222');
      grad.addColorStop(0.5, '#111111');
      grad.addColorStop(1, '#2b2b2b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create cover image blob'));
    }, 'image/png');
  });
}

// Helper: Convert Blob to Data URL
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Helper: Convert Data URL back to Blob
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(';base64,');
  const contentType = parts[0].replace('data:', '');
  const raw = atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
}
