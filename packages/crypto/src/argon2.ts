/**
 * AFANTA — Argon2id Key Derivation
 *
 * @security-critical
 * Dùng để derive User-Derived Key (UDK) từ Master Password.
 * UDK KHÔNG BAO GIỜ được lưu xuống disk/log/metric.
 *
 * Reference: AFANTA_MASTER_PLAN_v2.md Phần C.2 Tầng 3 — Envelope Encryption.
 *           OWASP Password Storage Cheat Sheet (Argon2id recommended params).
 */

import { randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { DEFAULT_ARGON2_PARAMS, type Argon2Params } from './types';

/** Salt length in bytes (NIST recommends ≥ 16). */
export const SALT_LENGTH_BYTES = 16;

/**
 * @security-critical
 * Sinh salt mới (16 bytes random) — gọi mỗi lần encrypt session mới.
 */
export function generateSalt(): Buffer {
  return randomBytes(SALT_LENGTH_BYTES);
}

/**
 * @security-critical
 * Derive UDK (User-Derived Key) từ master password + salt.
 *
 * Trả về Buffer 32 bytes — caller có trách nhiệm wipe Buffer sau khi dùng xong:
 * `udk.fill(0)` để xoá khỏi RAM (best-effort, JS không guarantee).
 *
 * @param masterPassword - mật khẩu user nhập, KHÔNG được log
 * @param salt - 16+ bytes random salt, lưu cùng payload để derive lại
 * @param params - Argon2id params (memoryCost, timeCost, parallelism, hashLength)
 * @throws nếu masterPassword rỗng hoặc salt < 16 bytes
 */
export async function deriveUDK(
  masterPassword: string,
  salt: Buffer,
  params: Argon2Params = DEFAULT_ARGON2_PARAMS,
): Promise<Buffer> {
  if (masterPassword.length === 0) {
    throw new Error('Master password must not be empty');
  }
  if (salt.length < SALT_LENGTH_BYTES) {
    throw new Error(`Salt must be at least ${SALT_LENGTH_BYTES} bytes`);
  }

  const udk = await argon2.hash(masterPassword, {
    type: argon2.argon2id,
    memoryCost: params.memoryCost,
    timeCost: params.timeCost,
    parallelism: params.parallelism,
    hashLength: params.hashLength,
    salt,
    raw: true, // trả về Buffer thay vì PHC string
  });

  return udk as Buffer;
}
