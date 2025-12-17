import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  const types = await prisma.roomType.findMany({
    orderBy: { name: 'asc' }
  });
  return NextResponse.json(types);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { name, priceHalfDay, priceFullDay, facilities } = await request.json();
    
    // Pastikan facilities adalah array, jika tidak (misal string), jadikan array kosong
    const facilitiesArray = Array.isArray(facilities) ? facilities : [];

    const newType = await prisma.roomType.create({
      data: {
        name,
        priceHalfDay: Number(priceHalfDay),
        priceFullDay: Number(priceFullDay),
        facilities: facilitiesArray
      }
    });
    return NextResponse.json(newType);
  } catch (error) {
    return new NextResponse('Gagal membuat tipe kamar', { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { id, name, priceHalfDay, priceFullDay, facilities } = await request.json();
    
    const facilitiesArray = Array.isArray(facilities) ? facilities : [];

    const updatedType = await prisma.roomType.update({
      where: { id },
      data: {
        name,
        priceHalfDay: Number(priceHalfDay),
        priceFullDay: Number(priceFullDay),
        facilities: facilitiesArray
      }
    });
    return NextResponse.json(updatedType);
  } catch (error) {
    return new NextResponse('Gagal update tipe kamar', { status: 500 });
  }
}

// ... (DELETE biarkan sama seperti sebelumnya)
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return new NextResponse('ID required', { status: 400 });

  try {
    await prisma.roomType.delete({
      where: { id }
    });
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return new NextResponse('Gagal menghapus', { status: 500 });
  }
}