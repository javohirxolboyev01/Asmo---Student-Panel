// prisma/seed.ts — creates the first ADMIN (and, for local development, a demo teacher).
//
// Production / any remote database: pass real credentials, weak defaults are refused:
//   SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='long-password' npm run prisma:seed
// Optional teacher account:
//   SEED_TEACHER_EMAIL=... SEED_TEACHER_PASSWORD=... SEED_TEACHER_NAME="Ism Familiya"
// Local database without variables: admin@asmo.uz / admin123 and bekjon2000@gmail.com / 000000.
// Existing users are never overwritten (their password stays as it is).
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const prisma = new PrismaClient();
const env = process.env;
const isLocalDb = /@(localhost|127\.0\.0\.1)(:\d+)?\//.test(env.DATABASE_URL ?? '');

function credentials(prefix: 'ADMIN' | 'TEACHER', localEmail: string, localPassword: string) {
  const email = env[`SEED_${prefix}_EMAIL`]?.trim().toLowerCase();
  const password = env[`SEED_${prefix}_PASSWORD`];
  if (email && password) {
    if (password.length < 10) throw new Error(`SEED_${prefix}_PASSWORD must be at least 10 characters.`);
    return { email, password };
  }
  if (isLocalDb) return { email: localEmail, password: localPassword };
  return null;
}

async function main() {
  const admin = credentials('ADMIN', 'admin@asmo.uz', 'admin123');
  if (!admin)
    throw new Error('Remote database: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (weak defaults are only for localhost).');

  const existingAdmin = await prisma.user.findUnique({ where: { email: admin.email } });
  if (existingAdmin) {
    await prisma.user.update({ where: { id: existingAdmin.id }, data: { role: 'ADMIN', status: 'ACTIVE', updatedAt: new Date() } });
    console.log(`Admin already existed, ensured ADMIN role: ${admin.email} (password unchanged)`);
  } else {
    await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: admin.email,
        passwordHash: await bcrypt.hash(admin.password, 12),
        firstName: 'Asmo',
        lastName: 'Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });
    console.log(`Admin created: ${admin.email}`);
  }

  const teacher = credentials('TEACHER', 'bekjon2000@gmail.com', '000000');
  if (!teacher) return;
  const [firstName = 'Ustoz', ...rest] = (env.SEED_TEACHER_NAME ?? 'Bekjon Teacher').trim().split(/\s+/);
  const lastName = rest.join(' ') || 'Teacher';
  let user = await prisma.user.findUnique({ where: { email: teacher.email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: teacher.email,
        passwordHash: await bcrypt.hash(teacher.password, 12),
        firstName,
        lastName,
        role: 'TEACHER',
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });
    console.log(`Teacher created: ${teacher.email}`);
  } else {
    console.log(`Teacher already existed: ${teacher.email} (password unchanged)`);
  }
  await prisma.teacher.upsert({
    where: { userId: user.id },
    update: {},
    create: { id: crypto.randomUUID(), fullName: `${user.firstName} ${user.lastName}`, userId: user.id },
  });
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
