import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET: Ambil semua daftar denda
export async function GET() {
  const items = await prisma.chargeableItem.findMany({
    orderBy: { itemName: 'asc' }
  });
  return NextResponse.json(items);
}

// POST: Tambah denda baru
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  // Cek apakah user adalah admin (Opsional: sesuaikan dengan roleId/permissions Anda)
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { itemName, chargeAmount } = await request.json();
    
    const newItem = await prisma.chargeableItem.create({
      data: {
        itemName,
        chargeAmount: Number(chargeAmount)
      }
    });
    return NextResponse.json(newItem);
  } catch (error) {
    return new NextResponse('Gagal membuat item', { status: 500 });
  }
}

// PUT: Update harga atau nama denda
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { id, itemName, chargeAmount } = await request.json();
    
    const updatedItem = await prisma.chargeableItem.update({
      where: { id },
      data: {
        itemName,
        chargeAmount: Number(chargeAmount)
      }
    });
    return NextResponse.json(updatedItem);
  } catch (error) {
    return new NextResponse('Gagal update item', { status: 500 });
  }
}

// DELETE: Hapus denda
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return new NextResponse('ID required', { status: 400 });

  try {
    await prisma.chargeableItem.delete({
      where: { id }
    });
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return new NextResponse('Gagal menghapus item (Mungkin sedang dipakai di transaksi)', { status: 500 });
  }
}