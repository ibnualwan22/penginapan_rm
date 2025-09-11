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
  { params }: { params: { id: string } }
) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return new NextResponse('Akses ditolak', { status: 401 });
  }

  try {
    const body = await request.json();
    const { charges, paymentMethod, paymentStatus } = body; // <-- Ambil data pembayaran

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { 
        room: {
          include: {
            roomType: true // Sertakan data RoomType untuk harga dinamis
          }
        }
      }
    });

    if (!booking || !booking.room) {
      return new NextResponse('Booking tidak ditemukan', { status: 404 });
    }

    const now = new Date();
    let lateFee = 0;

    // --- LOGIKA PERHITUNGAN DENDA BARU DENGAN HARGA DINAMIS ---
    const totalLateHours = Math.max(0, differenceInHours(now, booking.expectedCheckOut));
    
    if (totalLateHours > 0) {
      const rates = {
        hourlyRate: 20_000,
        halfDayRate: booking.room.roomType.priceHalfDay,
        fullDayRate: booking.room.roomType.priceFullDay,
      };
      
      const fullDaysLate = Math.floor(totalLateHours / 24);
      if (fullDaysLate > 0) {
        lateFee += fullDaysLate * rates.fullDayRate;
      }
      
      const remainingHours = totalLateHours % 24;
      if (remainingHours >= 1 && remainingHours <= 11) {
        // Kategori 1: Denda per jam
        lateFee += remainingHours * rates.hourlyRate;
      } else if (remainingHours >= 12 && remainingHours <= 15) {
        // Kategori 2: Paket 1/2 hari + sisa jam
        lateFee += rates.halfDayRate + ((remainingHours - 12) * rates.hourlyRate);
      } else if (remainingHours >= 16 && remainingHours <= 23) {
        // Kategori 3: Harga terbaik
        const scenarioA = rates.halfDayRate + ((remainingHours - 12) * rates.hourlyRate);
        lateFee += Math.min(scenarioA, rates.fullDayRate);
      }
    }

    let chargesFee = 0;
    if (charges && charges.length > 0) {
      for (const charge of charges) {
        const item = await prisma.chargeableItem.findUnique({ where: { id: charge.chargeableItemId } });
        if (item) {
          chargesFee += item.chargeAmount * charge.quantity;
        }
      }
    }
    
    const totalFee = booking.baseFee + lateFee + chargesFee;

    await prisma.$transaction(async (tx) => {
      // 1. Update booking
      await tx.booking.update({
        where: { id: params.id },
        data: {
          checkOut: now,
          lateFee,
          totalFee,
          checkedOutById: session.user.id,
          paymentMethod: paymentMethod,
          paymentStatus: paymentStatus,
        },
      });

      // 2. Buat catatan sanksi
      if (charges && charges.length > 0) {
        await tx.bookingCharge.createMany({
          data: charges.map((charge: any) => ({
            bookingId: params.id,
            chargeableItemId: charge.chargeableItemId,
            quantity: charge.quantity,
          }))
        });
      }

      // 3. Update status kamar
      await tx.room.update({
        where: { id: booking.roomId },
        data: { status: 'AVAILABLE' },
      });
    });

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error('Check-out Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

