import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addHours } from 'date-fns'; // Kita perlu install date-fns

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      roomId,
      guestName,
      studentName,
      addressId,
      bookingType,
      duration, // <-- Ambil data durasi
      // Nanti kita akan tambahkan checkedInById dari sesi login
    } = body;

    // --- Perhitungan Tarif ---
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return new NextResponse('Kamar tidak ditemukan', { status: 404 });
    }

    let baseFee = 0;
    if (room.type === 'SPECIAL') {
      baseFee = bookingType === 'FULL_DAY' ? 350000 : 300000;
    } else {
      baseFee = bookingType === 'FULL_DAY' ? 300000 : 250000;
    }

    // --- Perhitungan Waktu Checkout ---
    const checkInTime = new Date();
    let hoursToAdd = 0;
    
    if (bookingType === 'FULL_DAY') {
      // Jika durasi tidak ada atau invalid, anggap 1 hari
      const days = duration > 0 ? duration : 1;
      hoursToAdd = days * 24;
    } else { // HALF_DAY
      hoursToAdd = 12;
    }
    const expectedCheckOut = addHours(checkInTime, hoursToAdd);

    // --- Simpan ke Database ---
    const newBooking = await prisma.booking.create({
      data: {
        roomId,
        guestName,
        studentName,
        addressId,
        baseFee,
        totalFee: baseFee, // Total awal sama dengan tarif dasar
        checkIn: checkInTime,
        expectedCheckOut,
        checkedInById: 'cmevqd1ew0000tvd64xoeoomj', // ID User statis untuk sementara
      },
    });

    // Update status kamar menjadi terisi
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