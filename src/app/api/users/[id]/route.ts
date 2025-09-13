import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Helper function yang diperbarui
async function canManageUser(managingUserId: string, targetUserId: string): Promise<boolean> {
  const managingUser = await prisma.user.findUnique({
    where: { id: managingUserId },
    include: { role: true, properties: true },
  });
  
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { role: true, properties: true },
  });

  if (!managingUser || !targetUser) return false;

  // --- ATURAN BARU ---
  // Super Admin tidak bisa dikelola oleh siapa pun, bahkan oleh dirinya sendiri (untuk edit)
  if (targetUser.role.name === 'Super Administrator') {
    return false;
  }
  
  // Super Admin bisa mengelola semua orang (selain dirinya sendiri)
  if (managingUser.role.name === 'Super Administrator') {
    return true;
  }
  
  // Admin Properti hanya bisa mengelola user di propertinya
  const managedPropertyIds = managingUser.properties.map(p => p.propertyId);
  const targetUserPropertyIds = targetUser.properties.map(p => p.propertyId);
  return targetUserPropertyIds.some(id => managedPropertyIds.includes(id));
}

// Mengedit pengguna
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return new NextResponse('Akses ditolak', { status: 401 });
  }

  try {
    const { id: userId } = await params;
    const isAuthorized = await canManageUser(session.user.id, userId);
    if (!isAuthorized) {
      return new NextResponse('Anda tidak punya izin untuk mengelola pengguna ini', { status: 403 });
    }
    
    const { name, username, roleId, password } = await request.json();
    const dataToUpdate: any = { name, username, roleId };
    if (password && password.trim() !== '') {
      dataToUpdate.password = bcrypt.hashSync(password, 10);
    }
    await prisma.user.update({ where: { id: userId }, data: dataToUpdate });
    return new NextResponse(null, { status: 204 });
  } catch (error) { 
    if ((error as any).code === 'P2002') {
        return new NextResponse('Username sudah digunakan', { status: 409 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Menghapus pengguna
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return new NextResponse('Akses ditolak', { status: 401 });
  }
  
  try {
    const { id: userId } = await params;

    // Tambahan: Cegah pengguna menghapus dirinya sendiri
    if (session.user.id === userId) {
        return new NextResponse('Anda tidak bisa menghapus akun Anda sendiri', { status: 403 });
    }

    const isAuthorized = await canManageUser(session.user.id, userId);
    if (!isAuthorized) {
      return new NextResponse('Anda tidak punya izin untuk mengelola pengguna ini', { status: 403 });
    }

    await prisma.user.delete({ where: { id: userId } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}