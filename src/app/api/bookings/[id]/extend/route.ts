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

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { 
        room: {
          include: {
            roomType: true // <-- Sertakan data RoomType
          }
        } 
      },
    });

    if (!booking || !booking.room) {
      return new NextResponse('Booking tidak ditemukan', { status: 404 });
    }

    // --- Kalkulasi Harga Dinamis ---
    let extensionFee = 0;
    let hoursToAdd = 0;
    let daysToAdd = 0;

    if (extensionType === 'FULL_DAY') {
      daysToAdd = duration > 0 ? duration : 1;
      extensionFee = booking.room.roomType.priceFullDay * daysToAdd;
      hoursToAdd = daysToAdd * 24;
    } else { // HALF_DAY
      extensionFee = booking.room.roomType.priceHalfDay;
      hoursToAdd = 12;
    }

    const currentExpected = new Date(booking.expectedCheckOut);
    const newExpectedCheckOut = addHours(currentExpected, hoursToAdd);

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        expectedCheckOut: newExpectedCheckOut,
        baseFee: { increment: extensionFee },
        totalFee: { increment: extensionFee },
        durationInDays: { increment: daysToAdd },
      },
      include: { room: true },
    });

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error('Extend Stay Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}