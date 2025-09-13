import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Terima propertyId dari form
    const { roomNumber, floor, roomTypeId, propertyId } = body;

    if (!roomNumber || !floor || !roomTypeId || !propertyId) {
      return new NextResponse('Data tidak lengkap', { status: 400 });
    }

    const newRoom = await prisma.room.create({
      data: {
        roomNumber,
        floor: parseInt(floor),
        property: { connect: { id: propertyId } }, // Hubungkan ke properti
        roomType: { connect: { id: roomTypeId } },
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