import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    const whereClause: any = {};
    if (propertyId) {
      whereClause.propertyId = propertyId;
    }

    const allRooms = await prisma.room.findMany({
      where: whereClause,
      select: {
        id: true,
        roomNumber: true,
        status: true,
        property: {
          select: { id: true, name: true, isFree: true },
        },
        roomType: {
          select: { name: true, priceFullDay: true },
        },
      },
      orderBy: [{ property: { name: 'asc' }}, { roomNumber: 'asc' }],
    });

    return NextResponse.json(allRooms);
  } catch (error) {
    console.error("Public All Rooms API Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}