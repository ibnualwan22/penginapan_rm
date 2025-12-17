import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET: Ambil semua tipe kamar
export async function GET() {
  const types = await prisma.roomType.findMany({
    orderBy: { name: 'asc' }
  });
  return NextResponse.json(types);
}

// POST: Buat tipe kamar baru
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { name, priceHalfDay, priceFullDay } = await request.json();
    
    // Validasi sederhana
    if (!name || !priceHalfDay || !priceFullDay) {
        return new NextResponse('Data tidak lengkap', { status: 400 });
    }

    const newType = await prisma.roomType.create({
      data: {
        name,
        priceHalfDay: Number(priceHalfDay),
        priceFullDay: Number(priceFullDay)
      }
    });
    return NextResponse.json(newType);
  } catch (error) {
    return new NextResponse('Gagal membuat tipe kamar', { status: 500 });
  }
}

// PUT: Update harga/nama
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { id, name, priceHalfDay, priceFullDay } = await request.json();
    
    const updatedType = await prisma.roomType.update({
      where: { id },
      data: {
        name,
        priceHalfDay: Number(priceHalfDay),
        priceFullDay: Number(priceFullDay)
      }
    });
    return NextResponse.json(updatedType);
  } catch (error) {
    return new NextResponse('Gagal update tipe kamar', { status: 500 });
  }
}

// DELETE: Hapus tipe kamar
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
    return new NextResponse('Gagal menghapus (Mungkin sedang dipakai di kamar)', { status: 500 });
  }
}