import { describe, expect, it } from 'vitest';
import { unwrapKey, wrapKey } from './aes-kw';
import { generateDEK } from './aes-gcm';
import { generateKEK } from './vault-client';

describe('aes-kw (RFC 3394)', () => {
  it('wrap → unwrap round-trip yields original DEK', () => {
    const dek = generateDEK();
    const kek = generateKEK();
    const wrapped = wrapKey(dek, kek);
    expect(wrapped.length).toBe(40); // 32 + 8 overhead
    const unwrapped = unwrapKey(wrapped, kek);
    expect(unwrapped.equals(dek)).toBe(true);
  });

  it('unwrap with wrong KEK → throws (self-check fails)', () => {
    const dek = generateDEK();
    const kek = generateKEK();
    const wrongKek = generateKEK();
    const wrapped = wrapKey(dek, kek);
    expect(() => unwrapKey(wrapped, wrongKek)).toThrow();
  });

  it('rejects keys of wrong length', () => {
    const dek = generateDEK();
    const kek = generateKEK();
    expect(() => wrapKey(Buffer.alloc(16), kek)).toThrow(/32 bytes/);
    expect(() => wrapKey(dek, Buffer.alloc(16))).toThrow(/KEK/);
    expect(() => unwrapKey(Buffer.alloc(40), Buffer.alloc(16))).toThrow(/KEK/);
    expect(() => unwrapKey(Buffer.alloc(20), kek)).toThrow(/Wrapped key/);
  });

  it('wrapped output is non-deterministic w.r.t. wrapping process is deterministic for same inputs', () => {
    // RFC 3394 has fixed IV → output IS deterministic for same (DEK, KEK)
    const dek = generateDEK();
    const kek = generateKEK();
    const w1 = wrapKey(dek, kek);
    const w2 = wrapKey(dek, kek);
    expect(w1.equals(w2)).toBe(true);
  });
});
