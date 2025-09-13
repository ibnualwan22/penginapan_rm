import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { differenceInHours } from 'date-fns';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Mengambil detail satu booking
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> } // params adalah Promise
) {
  try {
    const { id } = await params; // Wajib di-await
    const booking = await prisma.booking.findUnique({
      where: { id: id },
      include: {
        room: { include: { property: true, roomType: true } },
        checkedInBy: { select: { name: true }},
        checkedOutBy: { select: { name: true }},
      },
    });

    if (!booking) {
      return new NextResponse('Booking tidak ditemukan', { status: 404 });
    }
    return NextResponse.json(booking);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * Memproses check-out untuk satu booking.
 */
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
    const { charges, paymentMethod, paymentStatus } = await request.json();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: { include: { roomType: true, property: true } } }
    });

    if (!booking || !booking.room) {
      return new NextResponse('Booking tidak ditemukan', { status: 404 });
    }
    
    if (!managedPropertyIds.includes(booking.room.propertyId)) {
      return new NextResponse('Akses ke properti ini ditolak', { status: 403 });
    }
    
    // ... (Logika perhitungan denda dan sanksi tidak berubah) ...
    const now = new Date();
    let lateFee = 0;
    let chargesFee = 0;
    let totalFee = booking.baseFee;

    // --- LOGIKA BARU: HANYA HITUNG BIAYA JIKA PROPERTI TIDAK GRATIS ---
    if (!booking.room.property.isFree) {
      // Kalkulasi denda keterlambatan
      const totalLateHours = Math.max(0, differenceInHours(now, booking.expectedCheckOut));
      if (totalLateHours > 0 && booking.room.roomType) {
        const rates = {
          hourlyRate: 20_000,
          halfDayRate: booking.room.roomType.priceHalfDay,
          fullDayRate: booking.room.roomType.priceFullDay,
        };
        const fullDaysLate = Math.floor(totalLateHours / 24);
        if (fullDaysLate > 0) { lateFee += fullDaysLate * rates.fullDayRate; }
        const remainingHours = totalLateHours % 24;
        if (remainingHours >= 1 && remainingHours <= 11) { lateFee += remainingHours * rates.hourlyRate; } 
        else if (remainingHours >= 12 && remainingHours <= 15) { lateFee += rates.halfDayRate + ((remainingHours - 12) * rates.hourlyRate); } 
        else if (remainingHours >= 16 && remainingHours <= 23) { const scenarioA = rates.halfDayRate + ((remainingHours - 12) * rates.hourlyRate); lateFee += Math.min(scenarioA, rates.fullDayRate); }
      }

      // Kalkulasi biaya sanksi barang
      if (charges && charges.length > 0) {
        for (const charge of charges) {
          const item = await prisma.chargeableItem.findUnique({ where: { id: charge.chargeableItemId } });
          if (item) {
            chargesFee += item.chargeAmount * charge.quantity;
          }
        }
      }
      
      // Hitung total biaya akhir
      totalFee = booking.baseFee + lateFee + chargesFee;
    } else {
        // Jika properti gratis, pastikan semua biaya adalah nol
        lateFee = 0;
        chargesFee = 0;
        totalFee = 0;
    }
    
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { 
            checkOut: now, 
            lateFee, 
            totalFee, 
            checkedOutById: session.user.id,
            paymentMethod: booking.room.property.isFree ? null : paymentMethod,
            paymentStatus: booking.room.property.isFree ? null : paymentStatus,
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

