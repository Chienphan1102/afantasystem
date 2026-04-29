import { describe, expect, it } from 'vitest';
import { EnvKekProvider, generateKEK } from './vault-client';
import { KEY_LENGTH_BYTES } from './aes-gcm';

describe('vault-client / EnvKekProvider', () => {
  it('generateKEK produces a 32-byte buffer', () => {
    const kek = generateKEK();
    expect(kek.length).toBe(KEY_LENGTH_BYTES);
  });

  it('throws when KEK_DEV missing', () => {
    expect(() => new EnvKekProvider('')).toThrow(/KEK_DEV/);
  });

  it('throws when KEK_DEV decodes to wrong length', () => {
    const shortKek = Buffer.alloc(8).toString('hex'); // only 8 bytes
    expect(() => new EnvKekProvider(shortKek)).toThrow(/32 bytes/);
  });

  it('returns the same KEK for any tenant (Phase 1 limitation)', async () => {
    const kekHex = generateKEK().toString('hex');
    const provider = new EnvKekProvider(kekHex);
    const k1 = await provider.getOrCreateTenantKEK('tenant-A');
    const k2 = await provider.getOrCreateTenantKEK('tenant-B');
    expect(k1.equals(k2)).toBe(true);
    expect(provider.providerName).toBe('ENV_DEV');
  });

  it('rotateKEK is intentionally NOT supported in Phase 1 — throws clear error', async () => {
    const kekHex = generateKEK().toString('hex');
    const provider = new EnvKekProvider(kekHex);
    await expect(provider.rotateKEK('tenant-A')).rejects.toThrow(/rotation/);
  });
});
