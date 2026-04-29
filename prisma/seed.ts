/**
 * AFANTA — Seed Data
 *
 * Chạy: pnpm prisma db seed
 *
 * Tạo:
 *   1. Tenant mẫu "Demo Media Co."
 *   2. 50+ Permissions (theo Phần E.2 của MASTER_PLAN_v2.md)
 *   3. 6 Role hệ thống (OWNER, SUPER_ADMIN, GROUP_ADMIN, TEAM_LEAD, USER, VIEWER)
 *      với Permission set tương ứng
 *   4. 1 Group mẫu "Marketing Team"
 *   5. 1 User Owner với email từ env, password đã hash
 *
 * Idempotent: chạy nhiều lần OK (dùng upsert).
 */

import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient, RoleType } from '@prisma/client';

const prisma = new PrismaClient();

// ╔══════════════════════════════════════════════════════════════╗
// ║ Permission catalog (50+ permissions theo Phần E.2)            ║
// ╚══════════════════════════════════════════════════════════════╝

type PermissionDef = { key: string; category: string; description: string };

const PERMISSIONS: PermissionDef[] = [
  // BILLING
  { key: 'tenant:billing:read', category: 'BILLING', description: 'Xem hoá đơn, gói cước' },
  { key: 'tenant:billing:write', category: 'BILLING', description: 'Mua thêm Worker / Proxy' },
  { key: 'tenant:delete', category: 'BILLING', description: 'Xoá tổ chức (Tenant)' },

  // SYSTEM
  { key: 'system:db:configure', category: 'SYSTEM', description: 'Cấu hình Database / Vault' },
  { key: 'system:worker:manage', category: 'SYSTEM', description: 'Quản lý Worker pool' },
  { key: 'system:cron:configure', category: 'SYSTEM', description: 'Cấu hình Cronjob global' },
  { key: 'system:health:read', category: 'SYSTEM', description: 'Xem System Health (CPU/RAM)' },
  { key: 'system:backup:manage', category: 'SYSTEM', description: 'Backup / Restore' },

  // PROXY
  { key: 'proxy:manage', category: 'PROXY', description: 'Thêm/Xoá Proxy global' },
  { key: 'proxy:assign:group', category: 'PROXY', description: 'Phân bổ Proxy cho Group' },
  { key: 'proxy:assign:channel', category: 'PROXY', description: 'Chọn Proxy cho kênh cụ thể' },

  // GROUP & USER
  { key: 'group:create', category: 'ORG', description: 'Tạo Group mới' },
  { key: 'group:freeze', category: 'ORG', description: 'Đóng băng Group' },
  { key: 'group:invite', category: 'ORG', description: 'Mời user vào Group' },
  { key: 'user:role:assign', category: 'ORG', description: 'Đổi role của user' },
  { key: 'user:password:reset', category: 'ORG', description: 'Reset Master Password user' },

  // CHANNEL
  { key: 'channel:read:all', category: 'CHANNEL', description: 'Xem TẤT CẢ kênh toàn công ty' },
  { key: 'channel:read:group', category: 'CHANNEL', description: 'Xem kênh trong Group' },
  { key: 'channel:read:assigned', category: 'CHANNEL', description: 'Xem kênh được giao' },
  { key: 'channel:create', category: 'CHANNEL', description: 'Thêm kênh mới (login + bind)' },
  { key: 'channel:delete', category: 'CHANNEL', description: 'Xoá kênh' },
  { key: 'channel:rescan:single', category: 'CHANNEL', description: 'Quét lại 1 kênh' },
  { key: 'channel:rescan:bulk', category: 'CHANNEL', description: 'Quét lại HÀNG LOẠT (>10 kênh)' },
  { key: 'channel:proxy:toggle', category: 'CHANNEL', description: 'Bật/Tắt Proxy cho kênh' },

  // DATA & REPORTING
  { key: 'report:export', category: 'REPORT', description: 'Xuất báo cáo PDF/Excel' },
  { key: 'report:export:assigned', category: 'REPORT', description: 'Xuất báo cáo kênh được giao' },
  { key: 'audit:read', category: 'AUDIT', description: 'Xem Audit Log' },
  { key: 'audit:read:group', category: 'AUDIT', description: 'Xem Audit Log của Group' },
  { key: 'data:history:delete', category: 'DATA', description: 'Xoá dữ liệu lịch sử' },

  // ALERT & WEBHOOK
  { key: 'alert:configure:global', category: 'ALERT', description: 'Cấu hình Alert global' },
  { key: 'alert:configure:group', category: 'ALERT', description: 'Cấu hình Alert cho Group' },
  { key: 'alert:configure:personal', category: 'ALERT', description: 'Cấu hình Alert cá nhân' },
  { key: 'webhook:manage', category: 'ALERT', description: 'Tạo Webhook (incoming/outgoing)' },

  // SECURITY
  { key: 'security:vault:rotate', category: 'SECURITY', description: 'Rotate KEK trong Vault' },
  { key: 'security:session:revoke', category: 'SECURITY', description: 'Force logout user' },
  { key: 'security:2fa:enforce', category: 'SECURITY', description: 'Bắt buộc 2FA cho user' },
  { key: 'security:ip:whitelist', category: 'SECURITY', description: 'Quản lý IP Whitelist' },
];

// ╔══════════════════════════════════════════════════════════════╗
// ║ Role → Permission mapping (theo Phần E.2)                     ║
// ╚══════════════════════════════════════════════════════════════╝

const ROLE_PERMISSIONS: Record<RoleType, string[] | '*'> = {
  // OWNER có TẤT CẢ permissions
  OWNER: '*',

  // SUPER_ADMIN: hầu hết trừ billing
  SUPER_ADMIN: [
    'system:db:configure',
    'system:worker:manage',
    'system:cron:configure',
    'system:health:read',
    'system:backup:manage',
    'proxy:manage',
    'proxy:assign:group',
    'proxy:assign:channel',
    'group:create',
    'group:freeze',
    'group:invite',
    'user:role:assign',
    'user:password:reset',
    'channel:read:all',
    'channel:read:group',
    'channel:create',
    'channel:delete',
    'channel:rescan:single',
    'channel:rescan:bulk',
    'channel:proxy:toggle',
    'report:export',
    'audit:read',
    'data:history:delete',
    'alert:configure:global',
    'alert:configure:group',
    'webhook:manage',
    'security:vault:rotate',
    'security:session:revoke',
    'security:2fa:enforce',
    'security:ip:whitelist',
  ],

  // GROUP_ADMIN: quản lý trong group
  GROUP_ADMIN: [
    'system:health:read',
    'proxy:assign:channel',
    'group:invite',
    'user:role:assign',
    'channel:read:group',
    'channel:create',
    'channel:delete',
    'channel:rescan:single',
    'channel:rescan:bulk',
    'channel:proxy:toggle',
    'report:export',
    'audit:read:group',
    'alert:configure:group',
    'alert:configure:personal',
    'webhook:manage',
  ],

  // TEAM_LEAD: trưởng nhóm
  TEAM_LEAD: [
    'group:invite',
    'channel:read:group',
    'channel:create',
    'channel:rescan:single',
    'channel:proxy:toggle',
    'report:export',
    'alert:configure:personal',
  ],

  // USER: nhân viên vận hành
  USER: [
    'channel:read:assigned',
    'channel:create',
    'channel:rescan:single',
    'report:export:assigned',
    'alert:configure:personal',
  ],

  // VIEWER: chỉ đọc
  VIEWER: ['channel:read:group', 'report:export:assigned', 'audit:read:group'],

  // CUSTOM: không seed quyền cứng
  CUSTOM: [],
};

const ROLE_NAMES_VI: Record<RoleType, { name: string; description: string }> = {
  OWNER: { name: 'Owner', description: 'Chủ doanh nghiệp / CEO — toàn quyền + billing' },
  SUPER_ADMIN: { name: 'Super Admin', description: 'CTO / Tech Lead — quản trị kỹ thuật' },
  GROUP_ADMIN: { name: 'Group Admin', description: 'Trưởng phòng — quản lý trong nhóm' },
  TEAM_LEAD: { name: 'Team Lead', description: 'Trưởng nhóm — quản lý team con' },
  USER: { name: 'User', description: 'Nhân viên vận hành' },
  VIEWER: { name: 'Viewer', description: 'Chỉ đọc — kiểm toán, khách' },
  CUSTOM: { name: 'Custom Role', description: 'Vai trò tuỳ biến' },
};

// ╔══════════════════════════════════════════════════════════════╗
// ║ Helpers                                                       ║
// ╚══════════════════════════════════════════════════════════════╝

function require_env(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

function log(msg: string): void {
  // eslint-disable-next-line no-console
  console.log(msg);
}

// ╔══════════════════════════════════════════════════════════════╗
// ║ Main                                                          ║
// ╚══════════════════════════════════════════════════════════════╝

async function main(): Promise<void> {
  log('🌱 Bắt đầu seed AFANTA database...\n');

  // ── 1. Permissions ──────────────────────────────────────────
  log('① Đang seed Permissions...');
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { category: p.category, description: p.description },
      create: p,
    });
  }
  log(`   ✓ Đã có ${PERMISSIONS.length} permissions\n`);

  // ── 2. Tenant ───────────────────────────────────────────────
  log('② Đang seed Tenant mẫu...');
  const tenantName = process.env.SEED_TENANT_NAME ?? 'Demo Media Co.';
  const tenantSlug = process.env.SEED_TENANT_SLUG ?? 'demo-media-co';
  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    update: { name: tenantName },
    create: { name: tenantName, slug: tenantSlug },
  });
  log(`   ✓ Tenant: ${tenant.name} (slug=${tenant.slug})\n`);

  // ── 3. Roles + RolePermissions (system roles, tenantId=null) ─
  log('③ Đang seed Roles hệ thống + Permission mapping...');
  const allPermissions = await prisma.permission.findMany();
  const permByKey = new Map(allPermissions.map((p) => [p.key, p]));

  for (const roleType of Object.keys(ROLE_PERMISSIONS) as RoleType[]) {
    const meta = ROLE_NAMES_VI[roleType];
    const role = await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: meta.name } },
      update: { type: roleType, description: meta.description, isSystem: true },
      create: {
        tenantId: tenant.id,
        name: meta.name,
        type: roleType,
        description: meta.description,
        isSystem: true,
      },
    });

    // Wire permissions
    const allowed = ROLE_PERMISSIONS[roleType];
    const keysToGrant = allowed === '*' ? PERMISSIONS.map((p) => p.key) : allowed;

    // Reset existing role permissions then re-create
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    for (const key of keysToGrant) {
      const perm = permByKey.get(key);
      if (!perm) {
        log(`   ⚠️  Permission key not found: ${key}`);
        continue;
      }
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId: perm.id },
      });
    }
    log(`   ✓ Role ${meta.name} (${roleType}): ${keysToGrant.length} permissions`);
  }
  log('');

  // ── 4. Group mẫu ────────────────────────────────────────────
  log('④ Đang seed Group mẫu "Marketing Team"...');
  const group = await prisma.group.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Marketing Team' } },
    update: { description: 'Phòng Marketing mẫu' },
    create: {
      tenantId: tenant.id,
      name: 'Marketing Team',
      description: 'Phòng Marketing mẫu',
    },
  });
  log(`   ✓ Group: ${group.name}\n`);

  // ── 5. Owner User ───────────────────────────────────────────
  log('⑤ Đang seed Owner User...');
  const ownerEmail = require_env('SEED_OWNER_EMAIL');
  const ownerPassword = require_env('SEED_OWNER_PASSWORD');
  const hashedPassword = await bcrypt.hash(ownerPassword, 12);

  const owner = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: ownerEmail } },
    update: { hashedPassword, isActive: true },
    create: {
      tenantId: tenant.id,
      email: ownerEmail,
      hashedPassword,
      fullName: 'AFANTA Owner',
      isActive: true,
      mustChangePassword: true, // bắt buộc đổi password lần đầu
    },
  });
  log(`   ✓ Owner: ${owner.email} (id=${owner.id})`);

  // Gán Owner role cho user vừa tạo
  // (dùng findFirst+create vì Postgres unique constraint với groupId=null không upsert được)
  const ownerRole = await prisma.role.findFirstOrThrow({
    where: { tenantId: tenant.id, type: RoleType.OWNER },
  });
  const existingOwnerRole = await prisma.userRole.findFirst({
    where: { userId: owner.id, roleId: ownerRole.id, groupId: null },
  });
  if (!existingOwnerRole) {
    await prisma.userRole.create({
      data: { userId: owner.id, roleId: ownerRole.id, groupId: null },
    });
  }
  log(`   ✓ Đã gán role OWNER (tenant-wide) cho ${owner.email}`);

  // Thêm Owner vào Group Marketing
  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId: owner.id, groupId: group.id } },
    update: {},
    create: { userId: owner.id, groupId: group.id },
  });
  log(`   ✓ Đã thêm ${owner.email} vào group "${group.name}"\n`);

  // ── Done ────────────────────────────────────────────────────
  log('🎉 Seed hoàn tất!\n');
  log('Đăng nhập lần đầu:');
  log(`   Email:    ${ownerEmail}`);
  log(`   Password: ${ownerPassword} (BẮT BUỘC đổi sau khi login lần đầu)`);
}

main()
  .catch((err: unknown) => {
    console.error('❌ Seed thất bại:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
