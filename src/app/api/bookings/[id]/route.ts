import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { differenceInHours } from 'date-fns';

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


// 2. FUNGSI UNTUK MEMPROSES CHECK-OUT
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    // Ambil data sanksi dari body request
    const { charges } = body; // charges akan berbentuk: [{ chargeableItemId: '...', quantity: 1 }]

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!booking) {
      return new NextResponse('Booking tidak ditemukan', { status: 404 });
    }

    const now = new Date();

    // --- Perhitungan Denda & Sanksi ---
    let lateFee = 0;
    const hoursDifference = Math.max(0, Math.ceil((now.getTime() - new Date(booking.expectedCheckOut).getTime()) / 3600000));
    if (hoursDifference > 0) {
      lateFee = hoursDifference * 20000;
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