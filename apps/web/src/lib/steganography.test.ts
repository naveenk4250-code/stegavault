import { describe, it, expect } from 'vitest';

function embedBitsIntoPixels(pixels: Uint8ClampedArray, payload: Uint8Array): void {
  const capacityBits = (pixels.length / 4) * 3;
  const totalBits = (payload.length + 4) * 8;
  if (totalBits > capacityBits) {
    throw new Error(
      `Cover image too small: needs ${Math.ceil(totalBits / 8)} bytes capacity, image only holds ${Math.floor(capacityBits / 8)} bytes.`
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
}

function extractBitsFromPixels(pixels: Uint8ClampedArray): Uint8Array {
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
  return readBits(payloadLength * 8, 32);
}

describe('steganography.ts (1-bit LSB Pixel Steganography)', () => {
  it('embeds and extracts payload bit-for-bit from pixel array', () => {
    const pixelCount = 1000;
    const pixels = new Uint8ClampedArray(pixelCount * 4);
    for (let i = 0; i < pixels.length; i++) {
      pixels[i] = Math.floor(Math.random() * 256);
    }

    const payload = new TextEncoder().encode('Secret embedded payload in RGB LSB channels.');
    embedBitsIntoPixels(pixels, payload);

    const extracted = extractBitsFromPixels(pixels);
    expect(new TextDecoder().decode(extracted)).toBe('Secret embedded payload in RGB LSB channels.');
  });

  it('throws a capacity error when payload exceeds pixel capacity', () => {
    const pixelCount = 10;
    const pixels = new Uint8ClampedArray(pixelCount * 4);
    const largePayload = new Uint8Array(500);

    expect(() => embedBitsIntoPixels(pixels, largePayload)).toThrow(/Cover image too small/);
  });
});
