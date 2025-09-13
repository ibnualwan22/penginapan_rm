import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Hitung booking selesai untuk setiap properti
    const rmBookings = await prisma.booking.count({
      where: {
        checkOut: { not: null },
        room: {
          property: {
            name: 'Penginapan RM',
          },
        },
      },
    });

    const rjBookings = await prisma.booking.count({
      where: {
        checkOut: { not: null },
        room: {
          property: {
            name: 'Raudlatul Jannah',
          },
        },
      },
    });

    return NextResponse.json({
      totalReservationsRM: rmBookings,
      totalReservationsRJ: rjBookings,
    });
  } catch (error) {
    console.error("Public Stats API Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}