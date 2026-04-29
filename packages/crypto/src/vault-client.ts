/**
 * AFANTA — Vault Client (KEK provider)
 *
 * @security-critical
 * Wrapper trừu tượng để lấy/ghi KEK (Key Encryption Key) cho từng tenant.
 *
 * Phase 1 (CLOUD-FIRST, KHÔNG có Docker):
 *   - Fallback dùng KEK_DEV trong .env (1 KEK chung cho mọi tenant)
 *   - Log cảnh báo CỰC KỲ RÕ ràng để KHÔNG nhầm lên production
 *
 * Phase 3 (production):
 *   - Implement HashiCorp Cloud Vault hoặc AWS KMS
 *   - Mỗi tenant có KEK riêng + version (rotate 90 ngày)
 *   - Shamir Secret Sharing chia KEK thành 5 mảnh
 *
 * Reference: AFANTA_MASTER_PLAN_v2.md Phần C, Phần M.4 (DR — Vault mất KEK = game over).
 */

import { randomBytes } from 'node:crypto';
import { KEY_LENGTH_BYTES } from './aes-gcm';

/**
 * Interface trừu tượng. Phase 3 sẽ có VaultRestProvider implement cùng interface
 * mà không cần đổi call site.
 */
export interface KEKProvider {
  /** Lấy KEK của tenant. Tạo mới nếu chưa có. */
  getOrCreateTenantKEK(tenantId: string): Promise<Buffer>;

  /** Rotate KEK — tạo version mới, giữ version cũ để decrypt data legacy. */
  rotateKEK(tenantId: string): Promise<{ newVersion: number }>;

  /** Gắn label để dễ phân biệt provider trong log. */
  readonly providerName: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 1 implementation: ENV-based fallback (DEV ONLY)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @security-critical Phase 1 only.
 * Đọc KEK_DEV từ env, decode hex → 32 bytes.
 * Same KEK cho tất cả tenant (ACCEPTABLE chỉ ở dev/Phase 1 vì zero-knowledge
 * vẫn được đảm bảo bởi UDK của user).
 */
export class EnvKekProvider implements KEKProvider {
  readonly providerName = 'ENV_DEV';
  private readonly kek: Buffer;
  private warnedOnce = false;

  constructor(kekHex?: string) {
    const hex = kekHex ?? process.env.KEK_DEV;
    if (!hex) {
      throw new Error(
        '[crypto] KEK_DEV missing in .env — cannot bootstrap EnvKekProvider. ' +
          "Generate one: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
      );
    }
    const buf = Buffer.from(hex, 'hex');
    if (buf.length !== KEY_LENGTH_BYTES) {
      throw new Error(`KEK_DEV must decode to ${KEY_LENGTH_BYTES} bytes (got ${buf.length})`);
    }
    this.kek = buf;
  }

  async getOrCreateTenantKEK(_tenantId: string): Promise<Buffer> {
    this.maybeWarn();
    return this.kek;
  }

  async rotateKEK(_tenantId: string): Promise<{ newVersion: number }> {
    this.maybeWarn();
    throw new Error(
      '[crypto] EnvKekProvider does not support rotation. Upgrade to a real Vault provider in Phase 3.',
    );
  }

  private maybeWarn(): void {
    if (this.warnedOnce) return;
    this.warnedOnce = true;

    console.warn(
      '\x1b[31m\x1b[1m[crypto] ⚠️  Using EnvKekProvider (DEV ONLY).\x1b[0m ' +
        'NOT acceptable in production — switch to HashiCorp Vault / AWS KMS in Phase 3.',
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sinh KEK random 256-bit (helper cho test, hoặc lúc seed env mới).
 */
export function generateKEK(): Buffer {
  return randomBytes(KEY_LENGTH_BYTES);
}
