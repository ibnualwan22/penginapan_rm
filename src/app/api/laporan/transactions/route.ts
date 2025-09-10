import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const whereClause: any = {
      checkOut: {
        not: null,
      },
    };

    if (from && to) {
      const adjustedTo = new Date(to);
      adjustedTo.setDate(adjustedTo.getDate() + 1);
      whereClause.checkOut = {
        gte: new Date(from),
        lte: adjustedTo,
      };
    }

    const transactions = await prisma.booking.findMany({
      where: whereClause,
      // --- PERUBAHAN UTAMA DI SINI ---
      include: {
        room: {
          select: {
            roomNumber: true,
          },
        },
        checkedInBy: { // Ambil data user yang melakukan check-in
          select: {
            name: true,
          },
        },
        checkedOutBy: { // Ambil data user yang melakukan check-out
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        checkOut: 'desc',
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Report API Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}