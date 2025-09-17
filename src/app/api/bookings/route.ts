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
  const managedPropertyIds = session.user.managedProperties.map(p => p.id);

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
      paymentMethod,
      paymentStatus
    } = body;

    if (!roomId || !guestName || !studentName || !addressId || !bookingType) {
        return new NextResponse('Data yang dibutuhkan tidak lengkap', { status: 400 });
    }

    const room = await prisma.room.findUnique({ 
      where: { id: roomId },
      include: { property: true, roomType: true } 
    });
    if (!room) {
      return new NextResponse('Kamar tidak ditemukan', { status: 404 });
    }
    
    if (!managedPropertyIds.includes(room.propertyId)) {
        return new NextResponse('Anda tidak memiliki izin untuk kamar ini', { status: 403 });
    }

    let baseFee = 0;
    const days = duration > 0 ? duration : 1;

    // --- PERBAIKAN UTAMA DI SINI ---
    // Kalkulasi harga sekarang dikalikan dengan durasi
    if (!room.property.isFree && room.roomType) {
      if (bookingType === 'FULL_DAY') {
        baseFee = room.roomType.priceFullDay * days;
      } else { // HALF_DAY
        baseFee = room.roomType.priceHalfDay;
      }
    }

    const checkInTime = new Date();
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
      paymentMethod: room.property.isFree ? null : paymentMethod,
      paymentStatus: room.property.isFree ? null : paymentStatus,
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