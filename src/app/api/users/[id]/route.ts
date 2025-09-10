import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Mengedit pengguna
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name, username, roleId, password } = await request.json();
    const userId = params.id;

    const dataToUpdate: any = {
      name,
      username,
      roleId,
    };

    // --- PERUBAHAN UTAMA DI SINI ---
    // Hanya update password jika kolomnya diisi (tidak kosong)
    if (password && password.trim() !== '') {
      dataToUpdate.password = bcrypt.hashSync(password, 10);
    }

    await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if ((error as any).code === 'P2002') {
        return new NextResponse('Username sudah digunakan', { status: 409 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Menghapus pengguna (fungsi ini tidak berubah)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.user.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
