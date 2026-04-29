/**
 * AFANTA — Envelope Encryption Orchestrator
 *
 * @security-critical
 * Hai hàm chính:
 *   - sealSession: encrypt SessionBundle thành EncryptedEnvelope (lưu DB)
 *   - unsealSession: decrypt EncryptedEnvelope về SessionBundle (worker dùng)
 *
 * Triple-Lock flow:
 *   1. Master password → Argon2id(salt) → UDK
 *   2. Random DEK → AES-GCM(SessionBundle, DEK, AAD) → ciphertext + tag
 *   3. UDK wraps DEK → wrappedDek (RFC 3394)
 *
 * Reference: AFANTA_MASTER_PLAN_v2.md Phần C.2 Tầng 3.
 */

import { deriveUDK, generateSalt } from './argon2';
import { decrypt as gcmDecrypt, encrypt as gcmEncrypt, generateDEK } from './aes-gcm';
import { unwrapKey, wrapKey } from './aes-kw';
import {
  type AadContext,
  type Argon2Params,
  DEFAULT_ARGON2_PARAMS,
  type EncryptedEnvelope,
  type SessionBundle,
} from './types';

/**
 * Build deterministic AAD string từ context. Bất kỳ field nào thay đổi sẽ làm
 * decrypt fail (auth tag không khớp) → chống replay/cross-tenant attack.
 */
function buildAad(ctx: AadContext): Buffer {
  const aadStr = `${ctx.tenantId}:${ctx.userId}:${ctx.platformAccountId}:${ctx.createdAt}`;
  return Buffer.from(aadStr, 'utf-8');
}

/** @security-critical Best-effort wipe — JS không guarantee, chỉ giảm risk dump. */
function wipe(buf: Buffer): void {
  buf.fill(0);
}

/**
 * @security-critical
 * Encrypt SessionBundle → EncryptedEnvelope sẵn sàng lưu DB.
 *
 * @param plaintext - SessionBundle vừa harvest từ Embedded Browser
 * @param masterPassword - mật khẩu user nhập (KHÔNG được log)
 * @param ctx - AAD context (tenantId, userId, platformAccountId, createdAt)
 * @param params - optional Argon2 params override (default DEFAULT_ARGON2_PARAMS)
 */
export async function sealSession(
  plaintext: SessionBundle,
  masterPassword: string,
  ctx: AadContext,
  params: Argon2Params = DEFAULT_ARGON2_PARAMS,
): Promise<EncryptedEnvelope> {
  const salt = generateSalt();
  let udk: Buffer | null = null;
  let dek: Buffer | null = null;

  try {
    udk = await deriveUDK(masterPassword, salt, params);
    dek = generateDEK();

    const aadBuf = buildAad(ctx);
    const plaintextBuf = Buffer.from(JSON.stringify(plaintext), 'utf-8');
    const { iv, ciphertext, tag } = gcmEncrypt(plaintextBuf, dek, aadBuf);
    const wrappedDek = wrapKey(dek, udk);

    return {
      version: 1,
      salt,
      iv,
      ciphertext,
      tag,
      wrappedDek,
      aad: aadBuf.toString('utf-8'),
      argon2: { ...params },
    };
  } finally {
    if (udk) wipe(udk);
    if (dek) wipe(dek);
  }
}

/**
 * @security-critical
 * Decrypt EncryptedEnvelope → SessionBundle (chỉ worker hoặc service nội bộ
 * được gọi). KHÔNG bao giờ expose qua public REST API.
 *
 * @throws nếu master password sai HOẶC ciphertext bị tamper HOẶC AAD mismatch
 */
export async function unsealSession(
  envelope: EncryptedEnvelope,
  masterPassword: string,
  ctx: AadContext,
): Promise<SessionBundle> {
  if (envelope.version !== 1) {
    throw new Error(`Unsupported envelope version: ${envelope.version}`);
  }

  const expectedAad = buildAad(ctx);
  const storedAad = Buffer.from(envelope.aad, 'utf-8');
  if (!expectedAad.equals(storedAad)) {
    throw new Error('AAD context mismatch — possible cross-tenant or replay attempt');
  }

  let udk: Buffer | null = null;
  let dek: Buffer | null = null;

  try {
    udk = await deriveUDK(masterPassword, envelope.salt, envelope.argon2);
    dek = unwrapKey(envelope.wrappedDek, udk);

    const plaintextBuf = gcmDecrypt(
      envelope.ciphertext,
      dek,
      envelope.iv,
      envelope.tag,
      expectedAad,
    );
    return JSON.parse(plaintextBuf.toString('utf-8')) as SessionBundle;
  } finally {
    if (udk) wipe(udk);
    if (dek) wipe(dek);
  }
}
