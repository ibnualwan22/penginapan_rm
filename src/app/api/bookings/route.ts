// src/app/api/bookings/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addHours } from 'date-fns';
import { Prisma } from '@prisma/client';

type BookingType = 'FULL_DAY' | 'HALF_DAY';

// ID user petugas yang melakukan check-in (WAJIB ADA di tabel user)
const CHECKED_IN_BY_DEFAULT = 'cmf9haf1n0000tvmauocyoqmg';

function normalizeBookingType(raw: any): BookingType {
  const key = String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_'); // "half day" | "HALFDAY" -> "HALF_DAY"
  if (key === 'HALF_DAY') return 'HALF_DAY';
  if (key === 'FULL_DAY') return 'FULL_DAY';
  return 'FULL_DAY';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const roomId: string = body.roomId;
    const bookingType: BookingType = normalizeBookingType(body.bookingType);

    if (!roomId || !body.guestName || !body.studentName || !body.addressId) {
      return NextResponse.json(
        { message: 'Data yang dibutuhkan tidak lengkap' },
        { status: 400 }
      );
    }

    // Durasi hari hanya untuk FULL_DAY; HALF_DAY -> 0
    const durationDays: number =
      bookingType === 'FULL_DAY'
        ? Math.max(1, Math.floor(Number(body.duration ?? 1)))
        : 0;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, type: true, status: true },
    });
    if (!room) return new NextResponse('Kamar tidak ditemukan', { status: 404 });
    if (room.status === 'OCCUPIED') return new NextResponse('Kamar sudah terisi', { status: 409 });

    // Tarif dasar
    const baseRate =
      room.type === 'SPECIAL'
        ? bookingType === 'FULL_DAY' ? 350_000 : 300_000
        : bookingType === 'FULL_DAY' ? 300_000 : 250_000;

    const baseFee = bookingType === 'FULL_DAY' ? baseRate * durationDays : baseRate;

    // Waktu
    const checkInTime = new Date();
    const hoursToAdd = bookingType === 'HALF_DAY' ? 12 : durationDays * 24;
    const expectedCheckOut = addHours(checkInTime, hoursToAdd);

    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          room: { connect: { id: roomId } },

          guestName: body.guestName,
          guestPhone: body.guestPhone ?? null,
          studentName: body.studentName,
          addressId: body.addressId,

          bookingType,
          durationInDays: durationDays,     // kirim selalu (0 utk HALF_DAY)
          baseFee,
          totalFee: baseFee,

          checkIn: checkInTime,
          expectedCheckOut,

          // SELALU isi checkedInBy dengan ID default
          checkedInBy: { connect: { id: CHECKED_IN_BY_DEFAULT } },
        },
        include: { room: true, checkedInBy: true },
      });

      await tx.room.update({
        where: { id: roomId },
        data: { status: 'OCCUPIED' },
      });

      return created;
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2003') {
        // foreign key tidak ketemu (room/checkedInBy)
        return new NextResponse(
          'Relasi tidak valid (room/checkedInBy). Pastikan ID petugas dan kamar ada.',
          { status: 400 }
        );
      }
      if (e.code === 'P2002') {
        return new NextResponse('Bentrok constraint unik.', { status: 409 });
      }
    }
    console.error('Check-in Error:', e);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
