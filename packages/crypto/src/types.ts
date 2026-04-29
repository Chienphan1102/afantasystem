/**
 * AFANTA — Crypto types
 *
 * Reference: AFANTA_MASTER_PLAN_v2.md Phần C (Triple-Lock Architecture).
 */

/**
 * Plaintext session bundle harvested từ Embedded Browser sau khi user login.
 * KHÔNG BAO GIỜ được serialize ra log/disk dưới dạng plaintext.
 */
export type SessionBundle = {
  cookies: unknown[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  indexedDB?: Record<string, unknown>;
  userAgent: string;
  viewport: string; // e.g. "1920x1080"
  timezone: string;
  acceptLanguage: string;
  fingerprintSeed: string;
};

/**
 * AAD (Additional Authenticated Data) — không được mã hoá nhưng được auth.
 * Chống replay attack: thay đổi 1 trong các field này sẽ làm decrypt fail.
 */
export type AadContext = {
  tenantId: string;
  userId: string;
  platformAccountId: string;
  createdAt: number; // unix epoch ms
};

/**
 * Cấu trúc payload đã mã hoá, lưu xuống database.
 * Tất cả binary đều base64-encoded khi lưu DB hoặc trả qua API.
 */
export type EncryptedEnvelope = {
  /** Schema version — nâng lên khi thay đổi format */
  version: 1;
  /** Salt cho Argon2id (16 bytes) */
  salt: Buffer;
  /** IV cho AES-GCM của session bundle (12 bytes) */
  iv: Buffer;
  /** Ciphertext của session bundle */
  ciphertext: Buffer;
  /** Auth tag GCM (16 bytes) */
  tag: Buffer;
  /** DEK đã wrap bằng UDK (RFC 3394 AES-KW, 40 bytes cho 32-byte DEK) */
  wrappedDek: Buffer;
  /** AAD as JSON string (lưu để client hiểu cách reconstruct) */
  aad: string;
  /** Argon2id params đã dùng (cho forward compatibility nếu thay đổi) */
  argon2: {
    memoryCost: number;
    timeCost: number;
    parallelism: number;
    hashLength: number;
  };
};

export type Argon2Params = {
  memoryCost: number;
  timeCost: number;
  parallelism: number;
  hashLength: number;
};

export const DEFAULT_ARGON2_PARAMS: Argon2Params = {
  memoryCost: 65536, // 64MB
  timeCost: 3,
  parallelism: 4,
  hashLength: 32,
};
