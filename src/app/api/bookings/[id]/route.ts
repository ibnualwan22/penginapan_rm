import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { differenceInHours } from 'date-fns';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Mengambil detail satu booking berdasarkan ID.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id: id },
      include: {
        room: {
            include: {
                roomType: true,
            }
        },
        checkedInBy: { select: { name: true }},
        checkedOutBy: { select: { name: true }},
      },
    });

    if (!booking) {
      return new NextResponse('Booking tidak ditemukan', { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Get Booking Detail Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * Memproses check-out untuk satu booking.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return new NextResponse('Akses ditolak', { status: 401 });
  }

  try {
    const { id: bookingId } = await params;
    const body = await request.json();
    // --- PERUBAHAN 1: Ambil data pembayaran dari body ---
    const { charges, paymentMethod, paymentStatus } = body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { 
        room: {
          include: {
            roomType: true
          }
        }
      }
    });

    if (!booking || !booking.room) {
      return new NextResponse('Booking tidak ditemukan', { status: 404 });
    }

    // ... (Logika perhitungan denda dan sanksi tidak berubah) ...
    const now = new Date();
    let lateFee = 0;
    const totalLateHours = Math.max(0, differenceInHours(now, booking.expectedCheckOut));
    if (totalLateHours > 0) {
        const rates = { hourlyRate: 20_000, halfDayRate: booking.room.roomType.priceHalfDay, fullDayRate: booking.room.roomType.priceFullDay, };
        const fullDaysLate = Math.floor(totalLateHours / 24);
        if (fullDaysLate > 0) { lateFee += fullDaysLate * rates.fullDayRate; }
        const remainingHours = totalLateHours % 24;
        if (remainingHours >= 1 && remainingHours <= 11) { lateFee += remainingHours * rates.hourlyRate; } 
        else if (remainingHours >= 12 && remainingHours <= 15) { lateFee += rates.halfDayRate + ((remainingHours - 12) * rates.hourlyRate); } 
        else if (remainingHours >= 16 && remainingHours <= 23) { const scenarioA = rates.halfDayRate + ((remainingHours - 12) * rates.hourlyRate); lateFee += Math.min(scenarioA, rates.fullDayRate); }
    }
    let chargesFee = 0;
    if (charges && charges.length > 0) { for (const charge of charges) { const item = await prisma.chargeableItem.findUnique({ where: { id: charge.chargeableItemId } }); if (item) { chargesFee += item.chargeAmount * charge.quantity; } } }
    const totalFee = booking.baseFee + lateFee + chargesFee;
    
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { 
            checkOut: now, 
            lateFee, 
            totalFee, 
            checkedOutById: session.user.id,
            // --- PERUBAHAN 2: Simpan data pembayaran ke database ---
            paymentMethod: paymentMethod,
            paymentStatus: paymentStatus,
        },
      });
      if (charges && charges.length > 0) { await tx.bookingCharge.createMany({ data: charges.map((charge: any) => ({ bookingId: bookingId, chargeableItemId: charge.chargeableItemId, quantity: charge.quantity })) }); }
      await tx.room.update({ where: { id: booking.roomId }, data: { status: 'AVAILABLE' } });
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Check-out Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

