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

export async function embedLSB(
  coverImage: File | Blob,
  payload: Uint8Array
): Promise<Blob> {
  const img = await loadImage(coverImage);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data; // RGBA Uint8ClampedArray

  // 3 usable channels per pixel (R,G,B - skip alpha), 1 bit each
  const capacityBits = (pixels.length / 4) * 3;
  const totalBits = (payload.length + 4) * 8; // +4 byte length header

  if (totalBits > capacityBits) {
    throw new Error(
      `Cover image too small: needs ${Math.ceil(totalBits / 8)} bytes capacity, image only holds ${Math.floor(capacityBits / 8)} bytes. Pick a larger cover image.`
    );
  }

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
  }

  ctx.putImageData(imageData, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to generate PNG blob from canvas'));
    }, 'image/png');
  });
}

export async function extractLSB(stegoImage: File | Blob): Promise<Uint8Array> {
  const img = await loadImage(stegoImage);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
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
