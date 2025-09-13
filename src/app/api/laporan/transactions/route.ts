import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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

    const whereClause: any = {
      checkOut: { not: null },
      // Filter berdasarkan properti yang dikelola
      room: {
        propertyId: {
          in: managedPropertyIds,
        },
      },
    };

    if (from && to) {
      const startDate = new Date(from);
      const endDate = new Date(to);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      whereClause.checkOut = {
        gte: startDate,
        lte: endDate,
      };
    }

    const transactions = await prisma.booking.findMany({
      where: whereClause,
      include: {
        // --- PERUBAHAN DI SINI ---
        room: {
          include: {
            property: true, // Sertakan detail properti
          },
        },
        checkedInBy: { select: { name: true } },
        checkedOutBy: { select: { name: true } },
      },
      orderBy: { checkOut: 'desc' },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Report API Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}