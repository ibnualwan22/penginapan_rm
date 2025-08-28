import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const transactions = await prisma.booking.findMany({
      where: {
        checkOut: {
          not: null, // Hanya ambil yang sudah check-out
        },
      },
      include: {
        room: {
          select: {
            roomNumber: true, // Hanya butuh nomor kamar
          },
        },
      },
      orderBy: {
        checkOut: 'desc', // Urutkan dari yang terbaru
      },
    });
    return NextResponse.json(transactions);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}