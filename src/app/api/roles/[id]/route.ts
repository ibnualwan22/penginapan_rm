import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Mengedit peran
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description, permissionIds } = await request.json();
    const roleId = params.id;

    await prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id: roleId },
        data: { name, description },
      });
      await tx.rolePermission.deleteMany({
        where: { roleId: roleId },
      });
      await tx.rolePermission.createMany({
        data: permissionIds.map((id: string) => ({
          roleId: roleId,
          permissionId: id,
        })),
      });
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Menghapus peran
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const usersInRole = await prisma.user.count({
      where: { roleId: params.id },
    });
    if (usersInRole > 0) {
      return new NextResponse(
        `Tidak bisa menghapus, masih ada ${usersInRole} pengguna dalam peran ini.`,
        { status: 409 }
      );
    }
    
    await prisma.role.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}