import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomNumber, floor, type } = body;

    // Validasi sederhana
    if (!roomNumber || !floor || !type) {
      return new NextResponse('Data tidak lengkap', { status: 400 });
    }

    const newRoom = await prisma.room.create({
      data: {
        roomNumber,
        floor: parseInt(floor), // Pastikan floor adalah angka
        type,
      },
    });

    return NextResponse.json(newRoom, { status: 201 });
  } catch (error) {
    console.error("Error Creating Room:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      // Urutkan berdasarkan nomor kamar
      orderBy: {
        roomNumber: 'asc',
      },
    });
    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Error Fetching Rooms:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}