import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    console.log("Received 'from' date:", from);
    console.log("Received 'to' date:", to);
    const whereClause: any = {
      checkOut: {
        not: null,
      },
    };

    if (from && to) {
      // Buat objek Date dari string tanggal UTC yang diterima
      const startDate = new Date(from);
      const endDate = new Date(to);

      

      // Secara eksplisit atur waktu ke awal dan akhir hari
      // berdasarkan zona waktu server (diasumsikan Asia/Jakarta)
      // startDate.setHours(0, 0, 0, 0);
      // endDate.setHours(23, 59, 59, 999);
      console.log("Start Date:", startDate);
      console.log("End Date:", endDate);

      whereClause.checkOut = {
        gte: startDate, // Lebih besar atau sama dengan pukul 00:00 WIB
        lte: endDate,   // Lebih kecil atau sama dengan pukul 23:59 WIB

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