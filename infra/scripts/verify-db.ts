import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const counts = {
    tenants: await prisma.tenant.count(),
    users: await prisma.user.count(),
    roles: await prisma.role.count(),
    permissions: await prisma.permission.count(),
    rolePermissions: await prisma.rolePermission.count(),
    userRoles: await prisma.userRole.count(),
    groups: await prisma.group.count(),
    groupMembers: await prisma.groupMember.count(),
  };

  // eslint-disable-next-line no-console
  console.log('\n📊 Database record counts:');
  for (const [k, v] of Object.entries(counts)) {
    // eslint-disable-next-line no-console
    console.log(`   ${k.padEnd(20)} = ${v}`);
  }

  const owner = await prisma.user.findFirst({
    where: { email: process.env.SEED_OWNER_EMAIL },
    include: {
      tenant: true,
      userRoles: { include: { role: true } },
      groupMembers: { include: { group: true } },
    },
  });

  if (owner) {
    // eslint-disable-next-line no-console
    console.log('\n👤 Owner user:');
    // eslint-disable-next-line no-console
    console.log(`   email:   ${owner.email}`);
    // eslint-disable-next-line no-console
    console.log(`   tenant:  ${owner.tenant.name} (slug=${owner.tenant.slug})`);
    // eslint-disable-next-line no-console
    console.log(`   roles:   ${owner.userRoles.map((ur) => ur.role.name).join(', ')}`);
    // eslint-disable-next-line no-console
    console.log(`   groups:  ${owner.groupMembers.map((gm) => gm.group.name).join(', ')}`);
  }
}

main()
  .catch((err: unknown) => {
    console.error('❌ Verify failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
