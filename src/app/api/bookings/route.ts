import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addHours } from 'date-fns';

/**
 * Menangani permintaan POST untuk membuat booking baru (proses check-in).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      roomId,
      guestName,
      guestPhone,
      studentName,
      addressId,
      addressLabel, // Field baru untuk nama alamat
      bookingType,
      duration,
    } = body;

    // Validasi dasar untuk memastikan data penting ada
    if (!roomId || !guestName || !studentName || !addressId || !bookingType) {
        return new NextResponse('Data yang dibutuhkan tidak lengkap', { status: 400 });
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return new NextResponse('Kamar tidak ditemukan', { status: 404 });
    }

    // --- Kalkulasi Biaya dan Waktu ---
    const isSpecial = room.type === 'SPECIAL';
    const baseFee =
      bookingType === 'FULL_DAY'
        ? (isSpecial ? 350_000 : 300_000)
        : (isSpecial ? 300_000 : 250_000);

    const checkInTime = new Date();
    const days = duration > 0 ? duration : 1;
    const hoursToAdd = bookingType === 'FULL_DAY' ? days * 24 : 12;
    const expectedCheckOut = addHours(checkInTime, hoursToAdd);

    // --- Siapkan Data untuk Disimpan ---
    const dataToCreate: any = {
      guestName,
      guestPhone,
      studentName,
      addressId,
      addressLabel, // Simpan nama alamat
      bookingType,
      baseFee,
      totalFee: baseFee, // Total awal sama dengan tarif dasar
      checkIn: checkInTime,
      expectedCheckOut,
      room: { connect: { id: roomId } },
      // PENTING: Ganti ID ini dengan ID User yang valid dari Prisma Studio Anda
      checkedInBy: { connect: { id: 'cmf9haf1n0000tvmauocyoqmg' } },
    };

    // Hanya tambahkan properti durationInDays jika paketnya FULL_DAY
    if (bookingType === 'FULL_DAY') {
      dataToCreate.durationInDays = days;
    }

    // --- Simpan ke Database ---
    const newBooking = await prisma.booking.create({
      data: dataToCreate,
    });

    // Update status kamar menjadi terisi
    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'OCCUPIED' },
    });

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error('Check-in Error:', error);
    // Memberikan detail error jika dalam mode development
    if (process.env.NODE_ENV === 'development') {
      console.log(error);
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

