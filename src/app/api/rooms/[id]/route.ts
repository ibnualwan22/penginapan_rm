import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Ambil data satu kamar berdasarkan ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const room = await prisma.room.findUnique({
      where: { id: params.id },
    });
    if (!room) {
      return new NextResponse('Kamar tidak ditemukan', { status: 404 });
    }
    return NextResponse.json(room);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Update/Edit data kamar berdasarkan ID
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { roomNumber, floor, type, status } = body;

    const updatedRoom = await prisma.room.update({
      where: { id: params.id },
      data: {
        roomNumber,
        floor: parseInt(floor),
        type,
        status,
      },
    });
    return NextResponse.json(updatedRoom);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Hapus kamar berdasarkan ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.room.delete({
      where: { id: params.id },
    });
    return new NextResponse(null, { status: 204 }); // 204 No Content
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}