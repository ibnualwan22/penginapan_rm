import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Mengambil semua pengguna beserta perannya
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return new NextResponse('Akses ditolak', { status: 401 });
  }

  try {
    const { role, managedProperties } = session.user;
    const whereClause: any = {};

    // Jika bukan Super Admin, filter berdasarkan properti yang dikelola
    if (role !== 'Super Administrator') {
      const managedPropertyIds = managedProperties.map(p => p.id);
      whereClause.properties = {
        some: {
          propertyId: {
            in: managedPropertyIds,
          },
        },
      };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    const usersWithoutPassword = users.map(({ password, ...user }) => user);
    return NextResponse.json(usersWithoutPassword);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Membuat pengguna baru
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return new NextResponse('Akses ditolak', { status: 401 });
  }

  try {
    const { name, username, password, roleId } = await request.json();

    if (!name || !username || !password || !roleId) {
        return new NextResponse('Data tidak lengkap', { status: 400 });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    // Buat user baru dalam sebuah transaksi
    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          username,
          password: hashedPassword,
          roleId,
        },
      });

      // --- LOGIKA PINTAR DI SINI ---
      // Jika pembuatnya bukan Super Admin (hanya punya 1 properti)
      if (session.user.managedProperties.length === 1) {
        // Otomatis hubungkan user baru ke properti yang sama dengan pembuatnya
        await tx.userProperty.create({
          data: {
            userId: createdUser.id,
            propertyId: session.user.managedProperties[0].id,
          }
        });
      }
      // Jika Super Admin yang membuat, dia harus menugaskan properti secara manual nanti
      // Untuk saat ini, user baru tidak terhubung ke properti manapun jika dibuat oleh Super Admin

      return createdUser;
    });
    
    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    if ((error as any).code === 'P2002') {
        return new NextResponse('Username sudah digunakan', { status: 409 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
