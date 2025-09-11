import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // 1. Buat semua izin (permissions) yang ada di sistem
  const permissions = [
    // Manajemen Kamar
    { name: 'dashboard:read:statistics', description: 'Melihat statistik di dashboard' },
    { name: 'rooms:read', description: 'Melihat daftar kamar' },
    { name: 'rooms:create', description: 'Menambah kamar baru' },
    { name: 'rooms:update', description: 'Mengedit kamar' },
    { name: 'rooms:delete', description: 'Menghapus kamar' },
    // Manajemen Booking
    { name: 'bookings:create', description: 'Melakukan check-in' },
    { name: 'bookings:read', description: 'Melihat tamu aktif' },
    { name: 'bookings:update', description: 'Melakukan check-out & perpanjangan' },
    // Laporan
    { name: 'reports:read', description: 'Melihat laporan transaksi' },
    // Manajemen Pengguna & Peran
    { name: 'users:read', description: 'Melihat daftar pengguna' },
    { name: 'users:create', description: 'Membuat pengguna baru' },
    { name: 'roles:read', description: 'Melihat daftar peran' },
    { name: 'roles:create', description: 'Membuat peran baru' },
    { name: 'users:update', description: 'Mengedit data pengguna' },
    { name: 'users:delete', description: 'Menghapus pengguna' },
    { name: 'roles:update', description: 'Mengedit peran & izinnya' },
    { name: 'prices:read', description: 'Melihat manajemen harga' },
    { name: 'prices:update', description: 'Mengubah harga tipe kamar' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }
  console.log('Permissions seeded.');

  // 2. Buat peran "Administrator"
  const allPermissions = await prisma.permission.findMany();
  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrator' },
    update: {},
    create: {
      name: 'Administrator',
      description: 'Memiliki semua hak akses',
    },
  });

  // Hubungkan semua izin ke peran Administrator
  await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
  await prisma.rolePermission.createMany({
    data: allPermissions.map(p => ({
      roleId: adminRole.id,
      permissionId: p.id,
    })),
  });
  console.log('Administrator role and permissions seeded.');

  // 3. Buat user "admin"
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Admin Utama',
      username: 'admin',
      password: hashedPassword,
      roleId: adminRole.id,
    },
  });
  console.log('Admin user seeded.');

  console.log('Seeding room types...');
  await prisma.roomType.upsert({
    where: { name: 'STANDARD' },
    update: {},
    create: {
      name: 'STANDARD',
      priceHalfDay: 250000,
      priceFullDay: 300000,
    },
  });

  await prisma.roomType.upsert({
    where: { name: 'SPECIAL' },
    update: {},
    create: {
      name: 'SPECIAL',
      priceHalfDay: 300000,
      priceFullDay: 350000,
    },
  });
  console.log('Room types seeded.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });