import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addHours } from 'date-fns';

type ExtensionType = 'FULL_DAY' | 'HALF_DAY';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const body = await request.json();
    const { extensionType, duration } = body as { extensionType: ExtensionType, duration: number };

    if (!extensionType) {
      return new NextResponse('Tipe perpanjangan tidak valid', { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true },
    });

    if (!booking || !booking.room) {
      return new NextResponse('Booking tidak ditemukan', { status: 404 });
    }

    // --- Kalkulasi Biaya & Waktu yang Diperbarui ---
    const isSpecial = booking.room.type === 'SPECIAL';
    let extensionFee = 0;
    let hoursToAdd = 0;
    let daysToAdd = 0;

    if (extensionType === 'FULL_DAY') {
      daysToAdd = duration > 0 ? duration : 1;
      const dailyRate = isSpecial ? 350_000 : 300_000;
      extensionFee = dailyRate * daysToAdd;
      hoursToAdd = daysToAdd * 24;
    } else { // HALF_DAY
      extensionFee = isSpecial ? 300_000 : 250_000;
      hoursToAdd = 12;
    }

    const currentExpected = new Date(booking.expectedCheckOut);
    const newExpectedCheckOut = addHours(currentExpected, hoursToAdd);

    // --- Update Database ---
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        expectedCheckOut: newExpectedCheckOut,
        baseFee: { increment: extensionFee },
        totalFee: { increment: extensionFee },
        // Tambahkan juga durasi harinya ke data yang sudah ada
        durationInDays: {
          increment: daysToAdd,
        },
      },
      include: { room: true },
    });

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error('Extend Stay Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

