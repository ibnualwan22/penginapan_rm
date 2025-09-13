import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const availableRooms = await prisma.room.findMany({
      where: {
        status: 'AVAILABLE',
      },
      select: {
        id: true,
        roomNumber: true,
        // Kita akan tambahkan foto di sini nanti
        property: {
          select: {
            id: true,
            name: true,
            isFree: true,
          },
        },
        roomType: {
          select: {
            name: true,
            priceHalfDay: true,
            priceFullDay: true,
          },
        },
      },
      orderBy: {
        roomNumber: 'asc',
      },
    });
    return NextResponse.json(availableRooms);
  } catch (error) {
    console.error("Public Rooms API Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}