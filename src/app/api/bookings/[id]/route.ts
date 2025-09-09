import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { differenceInHours } from 'date-fns';

// Helper function untuk tarif
const getRates = (roomType: 'STANDARD' | 'SPECIAL') => {
  const isSpecial = roomType === 'SPECIAL';
  return {
    hourlyRate: 20_000,
    halfDayRate: isSpecial ? 300_000 : 250_000,
    fullDayRate: isSpecial ? 350_000 : 300_000,
  };
};

// 1. FUNGSI UNTUK MENGAMBIL DETAIL BOOKING
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        room: true, // Sertakan detail kamar
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


// 2. FUNGSI UNTUK MEMPROSES CHECK-OUT (LOGIKA BARU)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { charges } = body;

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { room: true }
    });

    if (!booking || !booking.room) {
      return new NextResponse('Booking tidak ditemukan', { status: 404 });
    }

    const now = new Date();
    let lateFee = 0;

    // --- LOGIKA PERHITUNGAN DENDA BARU ---
    const totalLateHours = differenceInHours(now, booking.expectedCheckOut);

    if (totalLateHours > 0) {
      const rates = getRates(booking.room.type);
      
      // Hitung siklus hari penuh
      const fullDaysLate = Math.floor(totalLateHours / 24);
      if (fullDaysLate > 0) {
        lateFee += fullDaysLate * rates.fullDayRate;
      }

      // Hitung sisa jam
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
          if(item) {
              chargesFee += item.chargeAmount * charge.quantity;
          }
      }
    }

    const totalFee = booking.baseFee + lateFee + chargesFee;

    // --- Gunakan Transaksi untuk Keamanan Data ---
    await prisma.$transaction(async (tx) => {
      // 1. Update booking
      await tx.booking.update({
        where: { id: params.id },
        data: {
          checkOut: now,
          lateFee,
          totalFee,
        },
      });

      // 2. Buat catatan untuk setiap sanksi
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