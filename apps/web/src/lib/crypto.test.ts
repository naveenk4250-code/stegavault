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

  it('computes correct SHA-256 hash digest', async () => {
    const data = new TextEncoder().encode('stegavault-integrity');
    const hash = await computeSHA256(data);
    expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
  });
});
