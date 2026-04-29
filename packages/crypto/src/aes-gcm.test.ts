import { describe, expect, it } from 'vitest';
import {
  decrypt,
  encrypt,
  generateDEK,
  generateIV,
  IV_LENGTH_BYTES,
  KEY_LENGTH_BYTES,
  TAG_LENGTH_BYTES,
} from './aes-gcm';

const AAD = Buffer.from('tenant1:user1:account1:1234567890', 'utf-8');

describe('aes-gcm', () => {
  it('generateDEK + generateIV produce correct lengths', () => {
    const k = generateDEK();
    const iv = generateIV();
    expect(k.length).toBe(KEY_LENGTH_BYTES);
    expect(iv.length).toBe(IV_LENGTH_BYTES);
  });

  it('encrypt → decrypt round-trip yields original plaintext', () => {
    const dek = generateDEK();
    const plaintext = Buffer.from('{"cookies":"abc123","ua":"test"}', 'utf-8');
    const { iv, ciphertext, tag } = encrypt(plaintext, dek, AAD);
    expect(iv.length).toBe(IV_LENGTH_BYTES);
    expect(tag.length).toBe(TAG_LENGTH_BYTES);
    const decoded = decrypt(ciphertext, dek, iv, tag, AAD);
    expect(decoded.equals(plaintext)).toBe(true);
  });

  it('Test 3: tampered ciphertext (1 byte flip) → decrypt throws', () => {
    const dek = generateDEK();
    const plaintext = Buffer.from('top secret session', 'utf-8');
    const { iv, ciphertext, tag } = encrypt(plaintext, dek, AAD);

    const tampered = Buffer.from(ciphertext);
    tampered[0] ^= 0x01;

    expect(() => decrypt(tampered, dek, iv, tag, AAD)).toThrow();
  });

  it('Test 4: wrong AAD → decrypt throws', () => {
    const dek = generateDEK();
    const plaintext = Buffer.from('top secret', 'utf-8');
    const { iv, ciphertext, tag } = encrypt(plaintext, dek, AAD);

    const wrongAad = Buffer.from('tenant1:user1:account1:9999999999', 'utf-8');
    expect(() => decrypt(ciphertext, dek, iv, tag, wrongAad)).toThrow();
  });

  it('wrong key (random different DEK) → decrypt throws', () => {
    const dek = generateDEK();
    const wrongDek = generateDEK();
    const plaintext = Buffer.from('top secret', 'utf-8');
    const { iv, ciphertext, tag } = encrypt(plaintext, dek, AAD);
    expect(() => decrypt(ciphertext, wrongDek, iv, tag, AAD)).toThrow();
  });

  it('encrypt rejects key of wrong length', () => {
    const badKey = Buffer.alloc(16);
    expect(() => encrypt(Buffer.from('x'), badKey, AAD)).toThrow(/32 bytes/);
  });

  it('decrypt rejects key/iv/tag of wrong length', () => {
    const dek = generateDEK();
    const ct = Buffer.from('xx', 'utf-8');
    expect(() => decrypt(ct, Buffer.alloc(16), generateIV(), Buffer.alloc(16), AAD)).toThrow();
    expect(() => decrypt(ct, dek, Buffer.alloc(8), Buffer.alloc(16), AAD)).toThrow(/IV/);
    expect(() => decrypt(ct, dek, generateIV(), Buffer.alloc(8), AAD)).toThrow(/Tag/);
  });

  it('Test 7: 100 encrypts of same plaintext+key produce 100 unique IVs', () => {
    const dek = generateDEK();
    const plaintext = Buffer.from('same plaintext', 'utf-8');
    const ivs = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const { iv } = encrypt(plaintext, dek, AAD);
      ivs.add(iv.toString('hex'));
    }
    expect(ivs.size).toBe(100);
  });
});
