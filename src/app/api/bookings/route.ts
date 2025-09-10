import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addHours } from 'date-fns';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Menangani permintaan POST untuk membuat booking baru (proses check-in).
 */
export async function POST(request: Request) {
  // 1. Ambil sesi pengguna yang sedang login
  const session = await getServerSession(authOptions);

  // Jika tidak ada sesi (pengguna tidak login), tolak permintaan
  if (!session || !session.user) {
    return new NextResponse('Akses ditolak', { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      roomId,
      guestName,
      guestPhone,
      studentName,
      addressId,
      addressLabel,
      bookingType,
      duration,
    } = body;

    if (!roomId || !guestName || !studentName || !addressId || !bookingType) {
        return new NextResponse('Data yang dibutuhkan tidak lengkap', { status: 400 });
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return new NextResponse('Kamar tidak ditemukan', { status: 404 });
    }

    const isSpecial = room.type === 'SPECIAL';
    const baseFee =
      bookingType === 'FULL_DAY'
        ? (isSpecial ? 350_000 : 300_000)
        : (isSpecial ? 300_000 : 250_000);

    const checkInTime = new Date();
    const days = duration > 0 ? duration : 1;
    const hoursToAdd = bookingType === 'FULL_DAY' ? days * 24 : 12;
    const expectedCheckOut = addHours(checkInTime, hoursToAdd);

    const dataToCreate: any = {
      guestName,
      guestPhone,
      studentName,
      addressId,
      addressLabel,
      bookingType,
      baseFee,
      totalFee: baseFee,
      checkIn: checkInTime,
      expectedCheckOut,
      room: { connect: { id: roomId } },
      // 2. Gunakan ID dari sesi pengguna yang aktif
      checkedInBy: { connect: { id: session.user.id } }, 
    };

    if (bookingType === 'FULL_DAY') {
      dataToCreate.durationInDays = days;
    }

    const newBooking = await prisma.booking.create({
      data: dataToCreate,
    });

    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'OCCUPIED' },
    });

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error('Check-in Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

