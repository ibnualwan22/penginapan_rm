// src/app/api/bookings/[id]/extend/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addHours, addDays } from 'date-fns';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Akses ditolak', { status: 401 });

  const { id } = await context.params;

  try {
    // Menerima parameter baru: extraHalfDay
    const { duration, type, extraHalfDay } = await request.json(); 

    // 1. Ambil Data Booking Lama
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { room: { include: { property: true, roomType: true } } },
    });

    if (!booking) return new NextResponse('Booking tidak ditemukan', { status: 404 });

    // 2. Cek Hak Akses
    const managedIds = session.user.managedProperties.map(p => p.id);
    if (!managedIds.includes(booking.room.propertyId)) {
        return new NextResponse('Akses properti ditolak', { status: 403 });
    }

    // 3. Hitung Biaya Tambahan & Waktu Baru
    let additionalFee = 0;
    let newExpectedCheckOut = new Date(booking.expectedCheckOut);
    let daysToAdd = 0;

    // --- LOGIKA BARU ---
    if (booking.room.property.isFree) {
        // PROPERTI GRATIS
        if (type === 'FULL_DAY') {
            newExpectedCheckOut = addDays(newExpectedCheckOut, duration);
            daysToAdd = duration;
            if (extraHalfDay) {
                newExpectedCheckOut = addHours(newExpectedCheckOut, 12);
            }
        } else {
            // Cuma nambah setengah hari
            newExpectedCheckOut = addHours(newExpectedCheckOut, 12);
        }
    } else {
        // PROPERTI BERBAYAR
        if (type === 'FULL_DAY') {
            // Hitung Hari Penuh
            daysToAdd = duration;
            newExpectedCheckOut = addDays(newExpectedCheckOut, duration);
            if (booking.room.roomType) {
                additionalFee += booking.room.roomType.priceFullDay * duration;
            }

            // Hitung Extra Setengah Hari (Jika ada)
            if (extraHalfDay) {
                newExpectedCheckOut = addHours(newExpectedCheckOut, 12);
                if (booking.room.roomType) {
                    additionalFee += booking.room.roomType.priceHalfDay;
                }
            }
        } else {
            // Murni Setengah Hari
            newExpectedCheckOut = addHours(newExpectedCheckOut, 12);
            if (booking.room.roomType) {
                additionalFee += booking.room.roomType.priceHalfDay;
            }
        }
    }

    // 4. Update Database
    await prisma.booking.update({
        where: { id },
        data: {
            expectedCheckOut: newExpectedCheckOut,
            baseFee: { increment: additionalFee },
            totalFee: { increment: additionalFee },
            durationInDays: { increment: daysToAdd },
            // Jika ada extraHalfDay, set true. Jika tidak, biarkan nilai lama atau false.
            isExtraHalfDay: extraHalfDay ? true : booking.isExtraHalfDay
        }
    });

    return NextResponse.json({ message: 'Berhasil diperpanjang' });

  } catch (error) {
    console.error("Extend Error:", error);
    return new NextResponse('Gagal memperpanjang durasi', { status: 500 });
  }
}