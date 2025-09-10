import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Mengambil semua pengguna beserta perannya
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    // Jangan kirim password ke client
    const usersWithoutPassword = users.map(({ password, ...user }) => user);
    return NextResponse.json(usersWithoutPassword);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Membuat pengguna baru
export async function POST(request: Request) {
  try {
    const { name, username, password, roleId } = await request.json();

    if (!name || !username || !password || !roleId) {
        return new NextResponse('Data tidak lengkap', { status: 400 });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        roleId,
      },
    });
    
    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    // Handle jika username sudah ada
    if ((error as any).code === 'P2002') {
        return new NextResponse('Username sudah digunakan', { status: 409 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
