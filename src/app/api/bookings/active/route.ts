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
    let { // Gunakan 'let' agar variabel bisa diubah
      roomId,
      guestName,
      guestPhone,
      studentName,
      addressId,
      addressLabel,
      bookingType,
      duration = 1,
      isExtraHalfDay = false,
      amountPaid = 0,
      paymentMethod,
    } = body;

    // [FIX ERROR INT VS STRING] 
    // Pastikan addressId dikonversi jadi String jika ada
    if (addressId) {
        addressId = String(addressId);
    }

    // 1. Validasi Dasar
    if (!roomId || !guestName || !bookingType) {
        return new NextResponse('Data wajib (Kamar, Nama Wali, Tipe Booking) tidak lengkap', { status: 400 });
    }

    const room = await prisma.room.findUnique({ 
      where: { id: roomId },
      include: { property: true, roomType: true } 
    });

    if (!room) {
      return new NextResponse('Kamar tidak ditemukan', { status: 404 });
    }
    
    // 2. Validasi Kepemilikan Properti
    if (!managedPropertyIds.includes(room.propertyId)) {
        return new NextResponse('Anda tidak memiliki izin untuk mengelola kamar ini', { status: 403 });
    }

    // 3. Logic Nama Santri
    const finalStudentName = studentName && studentName.trim() !== '' ? studentName : '-';

    // 4. Kalkulasi Biaya & Waktu
    let baseFee = 0;
    let hoursToAdd = 0;
    
    const days = bookingType === 'FULL_DAY' ? Math.max(1, duration) : 0;

    if (room.property.isFree) {
      baseFee = 0;
      if (bookingType === 'FULL_DAY') {
        hoursToAdd = days * 24;
        if (isExtraHalfDay) hoursToAdd += 12;
      } else {
        hoursToAdd = 12;
      }
    } else if (room.roomType) {
      if (bookingType === 'FULL_DAY') {
        baseFee = room.roomType.priceFullDay * days;
        hoursToAdd = days * 24;
        if (isExtraHalfDay) {
          baseFee += room.roomType.priceHalfDay;
          hoursToAdd += 12;
        }
      } else { 
        baseFee = room.roomType.priceHalfDay;
        hoursToAdd = 12;
      }
    }

    const checkInTime = new Date();
    const expectedCheckOut = addHours(checkInTime, hoursToAdd);

    // 5. Status Pembayaran Otomatis
    let finalPaymentStatus = 'UNPAID';
    if (room.property.isFree) {
      finalPaymentStatus = 'PAID';
    } else {
      // Pastikan angka float untuk perbandingan aman
      const paid = parseFloat(amountPaid.toString());
      if (paid >= baseFee) {
        finalPaymentStatus = 'PAID';
      } else if (paid > 0) {
        finalPaymentStatus = 'PARTIAL';
      } else {
        finalPaymentStatus = 'UNPAID';
      }
    }

    // 6. Simpan ke Database
    const newBooking = await prisma.booking.create({
      data: {
        roomId,
        guestName,
        guestPhone,
        studentName: finalStudentName,
        addressId, // Sekarang sudah aman (String)
        addressLabel,
        
        bookingType,
        durationInDays: days,
        isExtraHalfDay: Boolean(isExtraHalfDay),
        
        checkIn: checkInTime,
        expectedCheckOut,
        
        baseFee,
        totalFee: baseFee,
        
        amountPaid: parseFloat(amountPaid.toString()),
        paymentMethod: room.property.isFree ? null : paymentMethod,
        paymentStatus: finalPaymentStatus as any,
        
        checkedInById: session.user.id,
      },
    });

    // 7. Update Status Kamar
    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'OCCUPIED' },
    });

    return NextResponse.json(newBooking, { status: 201 });

  } catch (error) {
    console.error("Check-in Error:", error);
    return new NextResponse('Terjadi kesalahan saat memproses check-in. Pastikan data valid.', { status: 500 });
  }
}