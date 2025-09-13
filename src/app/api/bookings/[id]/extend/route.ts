import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addHours } from 'date-fns';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

type ExtensionType = 'FULL_DAY' | 'HALF_DAY';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // params adalah Promise
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return new NextResponse('Akses ditolak', { status: 401 });
  }
  const managedPropertyIds = session.user.managedProperties.map(p => p.id);

  try {
    const { id: bookingId } = await params; // Wajib di-await
    const { extensionType, duration } = (await request.json()) as { extensionType: ExtensionType, duration: number };

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { 
        room: {
          include: {
            property: true, // Sertakan info properti
            roomType: true 
          }
        } 
      },
    });

    if (!booking || !booking.room) {
      return new NextResponse('Booking tidak ditemukan', { status: 404 });
    }

    // --- LAPISAN KEAMANAN ---
    if (!managedPropertyIds.includes(booking.room.propertyId)) {
      return new NextResponse('Akses ke properti ini ditolak', { status: 403 });
    }
    
    let extensionFee = 0;
    let hoursToAdd = 0;
    let daysToAdd = 0;

    // --- LOGIKA BARU: HANYA HITUNG BIAYA JIKA PROPERTI TIDAK GRATIS ---
    if (!booking.room.property.isFree && booking.room.roomType) {
        if (extensionType === 'FULL_DAY') {
            daysToAdd = duration > 0 ? duration : 1;
            extensionFee = booking.room.roomType.priceFullDay * daysToAdd;
            hoursToAdd = daysToAdd * 24;
        } else { // HALF_DAY
            extensionFee = booking.room.roomType.priceHalfDay;
            hoursToAdd = 12;
        }
    } else {
        // Jika properti gratis, default perpanjangan adalah 1 hari tanpa biaya
        daysToAdd = duration > 0 ? duration : 1;
        hoursToAdd = daysToAdd * 24;
        extensionFee = 0; // Pastikan tidak ada biaya
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