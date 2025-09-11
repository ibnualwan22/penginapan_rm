import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addHours } from 'date-fns';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
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

    // Ambil data kamar beserta tipe dan harganya
    const room = await prisma.room.findUnique({ 
      where: { id: roomId },
      include: { roomType: true } // <-- Sertakan data RoomType
    });
    if (!room) {
      return new NextResponse('Kamar tidak ditemukan', { status: 404 });
    }

    // --- Kalkulasi Harga Dinamis ---
    const baseFee = bookingType === 'FULL_DAY'
        ? room.roomType.priceFullDay
        : room.roomType.priceHalfDay;

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