import { describe, expect, it } from 'vitest';
import { deriveUDK, generateSalt, SALT_LENGTH_BYTES } from './argon2';
import { DEFAULT_ARGON2_PARAMS } from './types';

// Speed up tests by lowering memoryCost for the suite (still uses argon2id).
const FAST_PARAMS = { ...DEFAULT_ARGON2_PARAMS, memoryCost: 8192, timeCost: 2 };

describe('argon2', () => {
  it('generateSalt produces 16-byte buffer of randomness', () => {
    const a = generateSalt();
    const b = generateSalt();
    expect(a.length).toBe(SALT_LENGTH_BYTES);
    expect(b.length).toBe(SALT_LENGTH_BYTES);
    expect(a.equals(b)).toBe(false);
  });

  it('rejects empty master password', async () => {
    await expect(deriveUDK('', generateSalt(), FAST_PARAMS)).rejects.toThrow(/empty/);
  });

  it('rejects short salt', async () => {
    await expect(deriveUDK('hello', Buffer.alloc(8), FAST_PARAMS)).rejects.toThrow(/Salt/);
  });

  it('Test 5: same password + same salt → same UDK (deterministic)', async () => {
    const salt = generateSalt();
    const udk1 = await deriveUDK('hunter2-secret', salt, FAST_PARAMS);
    const udk2 = await deriveUDK('hunter2-secret', salt, FAST_PARAMS);
    expect(udk1.length).toBe(32);
    expect(udk1.equals(udk2)).toBe(true);
  });

  it('Test 6: same password + different salt → different UDK', async () => {
    const udk1 = await deriveUDK('hunter2-secret', generateSalt(), FAST_PARAMS);
    const udk2 = await deriveUDK('hunter2-secret', generateSalt(), FAST_PARAMS);
    expect(udk1.equals(udk2)).toBe(false);
  });

  it('different password + same salt → different UDK', async () => {
    const salt = generateSalt();
    const udk1 = await deriveUDK('hunter2-secret', salt, FAST_PARAMS);
    const udk2 = await deriveUDK('hunter3-secret', salt, FAST_PARAMS);
    expect(udk1.equals(udk2)).toBe(false);
  });
});
