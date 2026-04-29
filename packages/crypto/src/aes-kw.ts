/**
 * AFANTA — AES Key Wrap (RFC 3394)
 *
 * @security-critical
 * Dùng để wrap DEK (Data Encryption Key) bằng UDK (User-Derived Key).
 * Output: 40 bytes cho 32-byte DEK (8 bytes overhead — IV check value).
 *
 * Reference: RFC 3394 — Advanced Encryption Standard (AES) Key Wrap Algorithm.
 *           AFANTA_MASTER_PLAN_v2.md Phần C.2 Tầng 3 Bước 3.
 */

import { createCipheriv, createDecipheriv } from 'node:crypto';
import { KEY_LENGTH_BYTES } from './aes-gcm';

/** RFC 3394 default IV (8 bytes A6A6A6A6A6A6A6A6) — hardcoded. */
const RFC3394_IV = Buffer.from('A6A6A6A6A6A6A6A6', 'hex');

/** OpenSSL/Node cipher name cho AES-256 Key Wrap. */
const AES_KW_ALGORITHM = 'id-aes256-wrap';

/**
 * @security-critical
 * Wrap DEK (32 bytes) bằng KEK/UDK (32 bytes) → 40 bytes wrapped output.
 *
 * @throws nếu length không khớp
 */
export function wrapKey(keyToWrap: Buffer, kek: Buffer): Buffer {
  if (keyToWrap.length !== KEY_LENGTH_BYTES) {
    throw new Error(`Key to wrap must be ${KEY_LENGTH_BYTES} bytes (got ${keyToWrap.length})`);
  }
  if (kek.length !== KEY_LENGTH_BYTES) {
    throw new Error(`KEK must be ${KEY_LENGTH_BYTES} bytes (got ${kek.length})`);
  }

  // Node passes IV explicitly; for KW the IV slot accepts the RFC 3394 default.
  const cipher = createCipheriv(AES_KW_ALGORITHM, kek, RFC3394_IV);
  return Buffer.concat([cipher.update(keyToWrap), cipher.final()]);
}

/**
 * @security-critical
 * Unwrap → 32-byte DEK. Throw nếu KEK sai (RFC 3394 self-check fail).
 */
export function unwrapKey(wrappedKey: Buffer, kek: Buffer): Buffer {
  if (kek.length !== KEY_LENGTH_BYTES) {
    throw new Error(`KEK must be ${KEY_LENGTH_BYTES} bytes (got ${kek.length})`);
  }
  if (wrappedKey.length !== KEY_LENGTH_BYTES + 8) {
    throw new Error(
      `Wrapped key must be ${KEY_LENGTH_BYTES + 8} bytes for 32-byte DEK (got ${wrappedKey.length})`,
    );
  }

  const decipher = createDecipheriv(AES_KW_ALGORITHM, kek, RFC3394_IV);
  return Buffer.concat([decipher.update(wrappedKey), decipher.final()]);
}
