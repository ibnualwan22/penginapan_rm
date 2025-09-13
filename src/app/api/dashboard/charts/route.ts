import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz'; // <-- Perubahan di sini

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return new NextResponse('Akses ditolak', { status: 401 });
  }
  const managedPropertyIds = session.user.managedProperties.map(p => p.id);

  if (managedPropertyIds.length === 0) {
      return NextResponse.json([]);
  }

  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const propertyId = searchParams.get('propertyId');
    const timeZone = 'Asia/Jakarta';

    const toDate = to ? new Date(to) : new Date();
    const fromDate = from ? new Date(from) : subDays(toDate, 7);
    
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    const propertyFilter = propertyId ? [propertyId] : managedPropertyIds;

    const bookings = await prisma.booking.findMany({
      where: {
        checkOut: {
          gte: fromDate,
          lte: toDate,
        },
        room: {
            propertyId: {
                in: propertyFilter,
            }
        }
      },
      orderBy: { checkOut: 'asc' },
    });
    
    const dailyData = bookings.reduce((acc, booking) => {
        if (booking.checkOut) {
            // Gunakan 'toZonedTime'
            const zonedCheckOut = toZonedTime(booking.checkOut, timeZone);
            const day = format(zonedCheckOut, 'dd MMM');
            if (!acc[day]) {
              acc[day] = { 'Pemasukan': 0, 'Kamar Disewa': 0 };
            }
            acc[day]['Pemasukan'] += booking.totalFee;
            acc[day]['Kamar Disewa'] += 1;
        }
        return acc;
    }, {} as Record<string, any>);
    
    const chartData = Object.keys(dailyData).map(day => ({
      date: day, ...dailyData[day],
    }));

    return NextResponse.json(chartData);
  } catch (error) {
    console.error('Chart Data Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}