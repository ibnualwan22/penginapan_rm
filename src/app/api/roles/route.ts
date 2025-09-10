import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Mengambil semua peran beserta izinnya
export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(roles);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Membuat peran baru
export async function POST(request: Request) {
  try {
    const { name, description, permissionIds } = await request.json();

    const newRole = await prisma.role.create({
      data: {
        name,
        description,
        permissions: {
          create: permissionIds.map((id: string) => ({
            permission: {
              connect: { id: id },
            },
          })),
        },
      },
    });
    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}