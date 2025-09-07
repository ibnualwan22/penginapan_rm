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
      whereClause.checkOut = {
        gte: new Date(from), // gte: greater than or equal
        lte: new Date(to),   // lte: less than or equal
      };
    }

    const transactions = await prisma.booking.findMany({
      where: whereClause,
      include: {
        room: { select: { roomNumber: true } },
      },
      orderBy: { checkOut: 'desc' },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}