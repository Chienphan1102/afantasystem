/**
 * AFANTA — AES-256-GCM symmetric encryption
 *
 * @security-critical
 * Dùng để mã hoá Session Bundle bằng DEK (Data Encryption Key).
 * IV phải UNIQUE cho mỗi lần encrypt với cùng key — tái sử dụng IV = thảm hoạ
 * (attacker recover plaintext qua XOR keystream).
 *
 * Reference: AFANTA_MASTER_PLAN_v2.md Phần C.2 Tầng 3.
 *           NIST SP 800-38D AES-GCM specification.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';

/** IV length cho GCM mode (NIST khuyến nghị 96 bit = 12 bytes). */
export const IV_LENGTH_BYTES = 12;

/** Key length cho AES-256 (32 bytes). */
export const KEY_LENGTH_BYTES = 32;

/** Auth tag length cho GCM (mặc định 16 bytes). */
export const TAG_LENGTH_BYTES = 16;

/**
 * @security-critical
 * Sinh DEK random 256-bit. Caller có trách nhiệm wipe sau khi dùng.
 */
export function generateDEK(): Buffer {
  return randomBytes(KEY_LENGTH_BYTES);
}

/**
 * @security-critical
 * Sinh IV random 96-bit. Caller phải dùng IV mới cho mỗi encrypt.
 */
export function generateIV(): Buffer {
  return randomBytes(IV_LENGTH_BYTES);
}

export type EncryptResult = {
  iv: Buffer;
  ciphertext: Buffer;
  tag: Buffer;
};

/**
 * @security-critical
 * Encrypt plaintext bằng DEK + AAD.
 *
 * @param plaintext - dữ liệu cần mã (vd JSON.stringify(SessionBundle))
 * @param key - DEK 32 bytes
 * @param aad - Additional Authenticated Data (chống replay)
 * @returns iv (12 bytes), ciphertext, tag (16 bytes)
 * @throws nếu key length sai
 */
export function encrypt(plaintext: Buffer, key: Buffer, aad: Buffer): EncryptResult {
  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error(`Key must be ${KEY_LENGTH_BYTES} bytes (got ${key.length})`);
  }

  const iv = generateIV();
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH_BYTES });
  cipher.setAAD(aad);

  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return { iv, ciphertext, tag };
}

/**
 * @security-critical
 * Decrypt ciphertext. Throw nếu auth tag fail (key sai / AAD sai / tampered).
 *
 * @throws nếu key/IV/tag length sai HOẶC tag verification fail
 */
export function decrypt(
  ciphertext: Buffer,
  key: Buffer,
  iv: Buffer,
  tag: Buffer,
  aad: Buffer,
): Buffer {
  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error(`Key must be ${KEY_LENGTH_BYTES} bytes (got ${key.length})`);
  }
  if (iv.length !== IV_LENGTH_BYTES) {
    throw new Error(`IV must be ${IV_LENGTH_BYTES} bytes (got ${iv.length})`);
  }
  if (tag.length !== TAG_LENGTH_BYTES) {
    throw new Error(`Tag must be ${TAG_LENGTH_BYTES} bytes (got ${tag.length})`);
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH_BYTES });
  decipher.setAAD(aad);
  decipher.setAuthTag(tag);

  // .final() throws "Unsupported state" nếu tag verification fail
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext;
}
