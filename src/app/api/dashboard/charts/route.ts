import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { format, subDays } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Tentukan rentang tanggal
    const fromDate = from ? new Date(from) : subDays(new Date(), 7);
    const toDate = to ? new Date(to) : new Date();

    const bookings = await prisma.booking.findMany({
      where: {
        checkOut: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { checkOut: 'asc' },
    });

    // ... (Logika reduce dan format chartData tetap sama)
    const dailyData = bookings.reduce((acc, booking) => {
      if (booking.checkOut) {
        const day = format(booking.checkOut, 'dd MMM');
        if (!acc[day]) {
          acc[day] = { 'Pemasukan': 0, 'Kamar Disewa': 0 };
        }
        acc[day]['Pemasukan'] += booking.totalFee;
        acc[day]['Kamar Disewa'] += 1;
      }
      return acc;
    }, {} as Record<string, { 'Pemasukan': number; 'Kamar Disewa': number }>);

    const chartData = Object.keys(dailyData).map(day => ({
      date: day,
      ...dailyData[day],
    }));

    return NextResponse.json(chartData);
  } catch (error) {
    console.error('Chart Data Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}