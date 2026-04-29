import { describe, expect, it } from 'vitest';
import { sealSession, unsealSession } from './envelope';
import type { AadContext, SessionBundle } from './types';
import { DEFAULT_ARGON2_PARAMS } from './types';

const FAST_PARAMS = { ...DEFAULT_ARGON2_PARAMS, memoryCost: 8192, timeCost: 2 };

const SAMPLE_BUNDLE: SessionBundle = {
  cookies: [
    { name: 'SAPISID', value: 'abc-secret-123', domain: '.youtube.com' },
    { name: 'LOGIN_INFO', value: 'def-secret-456', domain: '.youtube.com' },
  ],
  localStorage: { 'yt-pref': 'darkmode=1' },
  sessionStorage: {},
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
  viewport: '1920x1080',
  timezone: 'Asia/Ho_Chi_Minh',
  acceptLanguage: 'vi-VN,vi;q=0.9,en;q=0.8',
  fingerprintSeed: 'abc-fp-seed-xyz',
};

const CTX: AadContext = {
  tenantId: 'tenant-001',
  userId: 'user-001',
  platformAccountId: 'pa-001',
  createdAt: 1730000000000,
};

describe('envelope (Triple-Lock)', () => {
  it('Test 1: seal → unseal with same password yields original bundle', async () => {
    const sealed = await sealSession(SAMPLE_BUNDLE, 'master-pw-strong-1', CTX, FAST_PARAMS);
    expect(sealed.version).toBe(1);
    expect(sealed.salt.length).toBe(16);
    expect(sealed.iv.length).toBe(12);
    expect(sealed.tag.length).toBe(16);
    expect(sealed.wrappedDek.length).toBe(40);

    const unsealed = await unsealSession(sealed, 'master-pw-strong-1', CTX);
    expect(unsealed).toEqual(SAMPLE_BUNDLE);
  });

  it('Test 2: seal → unseal with WRONG password throws', async () => {
    const sealed = await sealSession(SAMPLE_BUNDLE, 'correct-password', CTX, FAST_PARAMS);
    await expect(unsealSession(sealed, 'wrong-password', CTX)).rejects.toThrow();
  });

  it('AAD mismatch (different tenantId) → throws even with correct password', async () => {
    const sealed = await sealSession(SAMPLE_BUNDLE, 'pw', CTX, FAST_PARAMS);
    const tamperedCtx: AadContext = { ...CTX, tenantId: 'other-tenant' };
    await expect(unsealSession(sealed, 'pw', tamperedCtx)).rejects.toThrow(/AAD/);
  });

  it('AAD mismatch (different createdAt) → throws', async () => {
    const sealed = await sealSession(SAMPLE_BUNDLE, 'pw', CTX, FAST_PARAMS);
    const tamperedCtx: AadContext = { ...CTX, createdAt: CTX.createdAt + 1 };
    await expect(unsealSession(sealed, 'pw', tamperedCtx)).rejects.toThrow(/AAD/);
  });

  it('tampered ciphertext (1 byte flip) → unseal throws even with correct password', async () => {
    const sealed = await sealSession(SAMPLE_BUNDLE, 'pw', CTX, FAST_PARAMS);
    sealed.ciphertext[0] ^= 0x01;
    await expect(unsealSession(sealed, 'pw', CTX)).rejects.toThrow();
  });

  it('tampered wrappedDek → unseal throws', async () => {
    const sealed = await sealSession(SAMPLE_BUNDLE, 'pw', CTX, FAST_PARAMS);
    sealed.wrappedDek[5] ^= 0x01;
    await expect(unsealSession(sealed, 'pw', CTX)).rejects.toThrow();
  });

  it('unsupported version → throws', async () => {
    const sealed = await sealSession(SAMPLE_BUNDLE, 'pw', CTX, FAST_PARAMS);
    const future = { ...sealed, version: 99 as 1 };
    await expect(unsealSession(future, 'pw', CTX)).rejects.toThrow(/version/);
  });

  it('two seals of same bundle produce different ciphertext (random salt + IV + DEK)', async () => {
    const a = await sealSession(SAMPLE_BUNDLE, 'pw', CTX, FAST_PARAMS);
    const b = await sealSession(SAMPLE_BUNDLE, 'pw', CTX, FAST_PARAMS);
    expect(a.salt.equals(b.salt)).toBe(false);
    expect(a.iv.equals(b.iv)).toBe(false);
    expect(a.ciphertext.equals(b.ciphertext)).toBe(false);
    expect(a.wrappedDek.equals(b.wrappedDek)).toBe(false);
    // But both decrypt back correctly
    expect(await unsealSession(a, 'pw', CTX)).toEqual(SAMPLE_BUNDLE);
    expect(await unsealSession(b, 'pw', CTX)).toEqual(SAMPLE_BUNDLE);
  });
});
