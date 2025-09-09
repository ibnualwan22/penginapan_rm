import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const activeBookings = await prisma.booking.findMany({
      where: {
        checkOut: null,
      },
      select: {
        id: true,
        guestName: true,
        guestPhone: true,
        studentName: true,
        addressLabel: true, // <-- Secara eksplisit meminta field ini
        checkIn: true,
        expectedCheckOut: true,
        bookingType: true,
        room: {
          select: { roomNumber: true },
        },
      },
      orderBy: {
        checkIn: 'asc',
      },
    });
    return NextResponse.json(activeBookings);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
