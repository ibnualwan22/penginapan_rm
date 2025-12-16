import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // =========================================
  // 1. SEED PERMISSIONS (Termasuk yang Baru)
  // =========================================
  const permissions = [
    // Dashboard & Statistik
    { name: 'dashboard:read:statistics', description: 'Melihat statistik di dashboard' },
    
    // Kamar
    { name: 'rooms:read', description: 'Melihat daftar & detail kamar' },
    { name: 'rooms:create', description: 'Menambah kamar baru' },
    { name: 'rooms:update', description: 'Mengedit data kamar' },
    { name: 'rooms:delete', description: 'Menghapus kamar' },
    
    // Booking / Transaksi
    { name: 'bookings:create', description: 'Melakukan check-in' },
    { name: 'bookings:read', description: 'Melihat tamu aktif' },
    { name: 'bookings:update', description: 'Melakukan check-out & perpanjangan' },
    
    // Laporan
    { name: 'reports:read', description: 'Melihat laporan transaksi' },
    
    // Harga
    { name: 'prices:read', description: 'Melihat manajemen harga' },
    { name: 'prices:update', description: 'Mengubah harga tipe kamar' },
    
    // User & Role
    { name: 'users:read', description: 'Melihat daftar pengguna' },
    { name: 'users:create', description: 'Membuat pengguna baru' },
    { name: 'users:update', description: 'Mengedit data pengguna' },
    { name: 'users:delete', description: 'Menghapus pengguna' },
    { name: 'roles:read', description: 'Melihat daftar peran' },
    { name: 'roles:create', description: 'Membuat peran baru' },
    { name: 'roles:update', description: 'Mengedit peran & izinnya' },
    { name: 'roles:delete', description: 'Menghapus peran' },

    // [BARU] Manajemen Denda / Sanksi Barang
    { name: 'charges:read', description: 'Melihat daftar denda barang' },
    { name: 'charges:create', description: 'Menambah item denda baru' },
    { name: 'charges:update', description: 'Mengedit item denda' },
    { name: 'charges:delete', description: 'Menghapus item denda' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }
  console.log('Permissions seeded.');

  // =========================================
  // 2. SEED PROPERTIES
  // =========================================
  const propRM = await prisma.property.upsert({
    where: { name: 'Penginapan RM' },
    update: {},
    create: { name: 'Penginapan RM', isFree: false },
  });
  const propRJ = await prisma.property.upsert({
    where: { name: 'Raudlatul Jannah' },
    update: {},
    create: { name: 'Raudlatul Jannah', isFree: true },
  });
  console.log('Properties seeded.');

  // =========================================
  // 3. SEED ROOM TYPES
  // =========================================
  await prisma.roomType.upsert({
    where: { name: 'STANDARD' },
    update: {},
    create: { name: 'STANDARD', priceHalfDay: 250000, priceFullDay: 300000 },
  });
  await prisma.roomType.upsert({
    where: { name: 'SPECIAL' },
    update: {},
    create: { name: 'SPECIAL', priceHalfDay: 300000, priceFullDay: 350000 },
  });
  console.log('Room types seeded.');

  // =========================================
  // 4. SEED CHARGEABLE ITEMS (SANKSI) - [BARU]
  // =========================================
  const chargeItems = [
    { itemName: 'Kunci Hilang', chargeAmount: 50000 },
    { itemName: 'Gelas/Piring Pecah', chargeAmount: 25000 },
    { itemName: 'Sprei Kotor/Rusak', chargeAmount: 100000 },
    { itemName: 'Remote AC Hilang', chargeAmount: 150000 },
  ];

  for (const item of chargeItems) {
    await prisma.chargeableItem.upsert({
      where: { itemName: item.itemName },
      update: { chargeAmount: item.chargeAmount },
      create: item,
    });
  }
  console.log('Chargeable Items seeded.');


  // =========================================
  // 5. SEED ROLES & PERMISSIONS
  // =========================================
  const allPermissions = await prisma.permission.findMany();

  // Role: Super Admin
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Administrator' },
    update: {},
    create: { name: 'Super Administrator', description: 'Akses penuh ke semua properti dan pengaturan.' },
  });
  // Reset & Assign permission
  await prisma.rolePermission.deleteMany({ where: { roleId: superAdminRole.id }});
  await prisma.rolePermission.createMany({
    data: allPermissions.map(p => ({ roleId: superAdminRole.id, permissionId: p.id }))
  });

  // Role: Admin Properti
  const propertyAdminRole = await prisma.role.upsert({
    where: { name: 'Admin Properti' },
    update: {},
    create: { name: 'Admin Properti', description: 'Akses operasional penuh untuk properti yang ditugaskan.' },
  });
  // Filter permission (Kecuali manajemen role)
  const propertyAdminPermissions = allPermissions.filter(p => !p.name.startsWith('roles:'));
  await prisma.rolePermission.deleteMany({ where: { roleId: propertyAdminRole.id }});
  await prisma.rolePermission.createMany({
    data: propertyAdminPermissions.map(p => ({ roleId: propertyAdminRole.id, permissionId: p.id }))
  });
  console.log('Roles seeded.');

  // =========================================
  // 6. SEED USERS
  // =========================================
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  
  // USER: Super Admin
  const superAdminUser = await prisma.user.upsert({
    where: { username: 'admin' }, 
    update: { password: hashedPassword, roleId: superAdminRole.id },
    create: { name: 'Admin Utama', username: 'admin', password: hashedPassword, roleId: superAdminRole.id },
  });
  // Connect properties
  await prisma.userProperty.deleteMany({ where: { userId: superAdminUser.id }});
  await prisma.userProperty.createMany({
    data: [{ userId: superAdminUser.id, propertyId: propRM.id }, { userId: superAdminUser.id, propertyId: propRJ.id }]
  });
  
  // USER: Admin RM
  const adminRMUser = await prisma.user.upsert({
    where: { username: 'admin_rm' }, 
    update: { password: hashedPassword, roleId: propertyAdminRole.id },
    create: { name: 'Admin RM', username: 'admin_rm', password: hashedPassword, roleId: propertyAdminRole.id },
  });
  await prisma.userProperty.deleteMany({ where: { userId: adminRMUser.id }});
  await prisma.userProperty.create({ data: { userId: adminRMUser.id, propertyId: propRM.id } });

  // USER: Admin RJ
  const adminRJUser = await prisma.user.upsert({
    where: { username: 'admin_rj' }, 
    update: { password: hashedPassword, roleId: propertyAdminRole.id },
    create: { name: 'Admin RJ', username: 'admin_rj', password: hashedPassword, roleId: propertyAdminRole.id },
  });
  await prisma.userProperty.deleteMany({ where: { userId: adminRJUser.id }});
  await prisma.userProperty.create({ data: { userId: adminRJUser.id, propertyId: propRJ.id } });

  console.log('Users seeded.');
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