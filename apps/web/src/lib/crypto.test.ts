import { describe, it, expect } from 'vitest';
import { encryptFile, decryptPacked, computeSHA256 } from './crypto';

describe('crypto.ts (Real AES-256-GCM + PBKDF2)', () => {
  it('round-trips a file exactly with the correct passphrase', async () => {
    const original = new File(['hello stegavault zero-knowledge test'], 'secret.txt', { type: 'text/plain' });
    const packed = await encryptFile(original, 'correct-horse-battery-staple');
    const decrypted = await decryptPacked(packed, 'correct-horse-battery-staple');
    const text = new TextDecoder().decode(decrypted);
    expect(text).toBe('hello stegavault zero-knowledge test');
  });

  it('throws when the passphrase is wrong (GCM authentication tag check fails)', async () => {
    const original = new File(['hello stegavault'], 'secret.txt', { type: 'text/plain' });
    const packed = await encryptFile(original, 'right-passphrase');
    await expect(decryptPacked(packed, 'wrong-passphrase')).rejects.toThrow();
  });

  it('preserves original filename and MIME type in decrypted payload metadata', async () => {
    const original = new File(['%PDF-1.4 confidential quarterly report'], 'financials_q4.pdf', { type: 'application/pdf' });
    const packed = await encryptFile(original, 'strong-password-123');
    const decrypted = await decryptPacked(packed, 'strong-password-123');
    expect((decrypted as any).filename).toBe('financials_q4.pdf');
    expect((decrypted as any).mimeType).toBe('application/pdf');
    expect(new TextDecoder().decode(decrypted)).toBe('%PDF-1.4 confidential quarterly report');
  });
});
