import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addHours } from 'date-fns';

type ExtensionType = 'FULL_DAY' | 'HALF_DAY';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // 👈 params adalah Promise
) {
  try {
    // ✅ Wajib di-await
    const { id: bookingId } = await params;

    const body = await request.json();
    const extensionType = (body?.extensionType ?? '') as ExtensionType;

    if (extensionType !== 'FULL_DAY' && extensionType !== 'HALF_DAY') {
      return new NextResponse('extensionType tidak valid', { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true },
    });

    if (!booking) {
      return new NextResponse('Booking tidak ditemukan', { status: 404 });
    }

    // --- Kalkulasi ---
    const isSpecial = booking.room?.type === 'SPECIAL';
    const extensionFee =
      extensionType === 'FULL_DAY'
        ? (isSpecial ? 350_000 : 300_000)
        : (isSpecial ? 300_000 : 250_000);

    const hoursToAdd = extensionType === 'FULL_DAY' ? 24 : 12;

    // Pastikan expectedCheckOut berupa Date
    const currentExpected = new Date(booking.expectedCheckOut);
    const newExpectedCheckOut = addHours(currentExpected, hoursToAdd);

    // --- Update Database ---
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        expectedCheckOut: newExpectedCheckOut,
        baseFee: { increment: extensionFee },
        totalFee: { increment: extensionFee },
      },
      include: { room: true },
    });

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error('Extend Stay Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
