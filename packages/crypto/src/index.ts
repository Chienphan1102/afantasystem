/**
 * AFANTA — @afanta/crypto public API
 *
 * @security-critical
 * Đây là lớp giao tiếp duy nhất với các module crypto bên trong.
 * KHÔNG import trực tiếp từ src/argon2.ts, src/aes-gcm.ts từ ngoài package này.
 */

export { generateSalt, deriveUDK, SALT_LENGTH_BYTES } from './argon2';
export {
  encrypt as gcmEncrypt,
  decrypt as gcmDecrypt,
  generateDEK,
  generateIV,
  IV_LENGTH_BYTES,
  KEY_LENGTH_BYTES,
  TAG_LENGTH_BYTES,
  type EncryptResult,
} from './aes-gcm';
export { wrapKey, unwrapKey } from './aes-kw';
export { sealSession, unsealSession } from './envelope';
export { EnvKekProvider, generateKEK, type KEKProvider } from './vault-client';
export {
  type AadContext,
  type Argon2Params,
  type EncryptedEnvelope,
  type SessionBundle,
  DEFAULT_ARGON2_PARAMS,
} from './types';
