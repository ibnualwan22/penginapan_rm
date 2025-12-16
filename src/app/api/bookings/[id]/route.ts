import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { differenceInMinutes } from 'date-fns';

const HOURLY_FINE = 20000; // Denda per jam (hanya untuk keterlambatan > 24 jam)

/**
 * FUNGSI HITUNG BIAYA DINAMIS
 * Rules:
 * 1. Durasi < 24 Jam (Hari Pertama): Hanya ada Paket Setengah Hari atau Full Day.
 * 2. Durasi > 24 Jam (Hari Berikutnya/Late): Berlaku Denda Per Jam / Rules Kategori.
 */
function calculateDynamicBill(checkIn: Date, checkOut: Date, priceFull: number, priceHalf: number) {
  const totalMinutes = differenceInMinutes(checkOut, checkIn);
  
  if (totalMinutes <= 0) return { totalBill: 0, durationDesc: '0 Jam', note: 'Durasi tidak valid' };

  // Pembulatan ke atas per jam
  const totalHours = Math.ceil(totalMinutes / 60);
  
  // Pisahkan Hari Penuh (Siklus 24 Jam) & Sisa Jam
  const fullDays = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  let finalCost = 0;
  let calculationNote = '';

  // --- LOGIKA UTAMA ---

  // KASUS A: KURANG DARI 24 JAM (Early Check-out / Short Stay)
  // Tidak main denda per jam, tapi main PAKET.
  if (fullDays === 0) {
      if (remainingHours <= 12) {
          // Rule: ≤ 12 Jam -> Hitung Setengah Hari
          finalCost = priceHalf;
          calculationNote = 'Durasi ≤ 12 Jam (Paket Setengah Hari)';
      } else {
          // Rule: > 12 Jam -> Hitung 1 Hari Penuh
          finalCost = priceFull;
          calculationNote = 'Durasi > 12 Jam (Paket 1 Hari)';
      }
  } 
  
  // KASUS B: LEBIH DARI 24 JAM (Late Check-out / Long Stay)
  // Hari penuh dihitung harga normal, sisanya kena RULES DENDA.
  else {
      let fineCost = 0;
      let fineNote = '';

      if (remainingHours === 0) {
          fineCost = 0;
          fineNote = '';
      }
      // Kategori 1: Denda Ringan (1-11 jam) -> Rp 20.000/jam
      else if (remainingHours >= 1 && remainingHours <= 11) {
          fineCost = remainingHours * HOURLY_FINE;
          fineNote = `+ Denda ${remainingHours} jam (x Rp 20rb)`;
      }
      // Kategori 2: Denda Sedang (12-15 jam) -> Setengah Hari + Sisa
      else if (remainingHours >= 12 && remainingHours <= 15) {
          const extraHours = remainingHours - 12;
          fineCost = priceHalf + (extraHours * HOURLY_FINE);
          fineNote = `+ Denda (Setengah Hari + ${extraHours} jam)`;
      }
      // Kategori 3: Denda Berat (16-23 jam) -> Full Day
      else {
          fineCost = priceFull;
          fineNote = `+ Denda (Auto Full Day)`;
      }

      finalCost = (fullDays * priceFull) + fineCost;
      calculationNote = fineNote;
  }

  // Deskripsi Durasi UI
  const durationDesc = fullDays > 0 
    ? `${fullDays} Hari ${remainingHours > 0 ? `+ ${remainingHours} Jam` : ''}`
    : `${remainingHours} Jam`;

  return { 
    totalBill: finalCost, 
    durationDesc,
    note: calculationNote
  };
}

// GET: Preview Tagihan
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        room: { include: { property: true, roomType: true } },
        checkedInBy: { select: { name: true } },
        checkedOutBy: { select: { name: true } },
      },
    });

    if (!booking) return new NextResponse('Booking tidak ditemukan', { status: 404 });

    let simulation = null;
    if (!booking.checkOut && !booking.room.property.isFree && booking.room.roomType) {
        const now = new Date();
        const calc = calculateDynamicBill(
            booking.checkIn, 
            now, 
            booking.room.roomType.priceFullDay, 
            booking.room.roomType.priceHalfDay
        );
        
        simulation = {
            totalBillActual: calc.totalBill,
            amountPaid: booking.amountPaid,
            remainingBill: calc.totalBill - booking.amountPaid,
            durationDesc: calc.durationDesc,
            note: calc.note
        };
    }

    return NextResponse.json({ ...booking, simulation });
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PATCH: Eksekusi Check-out
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return new NextResponse('Akses ditolak', { status: 401 });

  try {
    const { id } = await context.params;
    const body = await request.json(); 
    const { paymentMethod, charges } = body;

    const booking = await prisma.booking.findUnique({
        where: { id },
        include: { room: { include: { property: true, roomType: true } } }
    });

    if (!booking) return new NextResponse('Booking tidak ditemukan', { status: 404 });

    // 1. Hitung Final (Base Fee diperbarui sesuai durasi aktual)
    const now = new Date();
    let finalBaseFee = booking.baseFee; 
    let lateFee = 0; 

    if (!booking.room.property.isFree && booking.room.roomType) {
        const calc = calculateDynamicBill(
            booking.checkIn, 
            now, 
            booking.room.roomType.priceFullDay, 
            booking.room.roomType.priceHalfDay
        );
        
        // Simpan harga aktual sebagai base fee baru
        finalBaseFee = calc.totalBill;
        lateFee = 0; // Reset latefee karena logika dinamis sudah mencakup denda di dalam baseFee
    }

    // 2. Hitung Sanksi Barang
    let chargesFee = 0;
    if (charges && charges.length > 0) {
        for (const c of charges) {
            const item = await prisma.chargeableItem.findUnique({ where: { id: c.chargeableItemId } });
            if (item) chargesFee += (item.chargeAmount * c.quantity);
        }
    }

    const totalFee = finalBaseFee + chargesFee;
    
    // 3. FORCE STATUS: PAID (LUNAS)
    // Sesuai permintaan: Saat tombol submit ditekan, status otomatis LUNAS.
    // Asumsinya kekurangan bayar dilunasi di kasir saat itu juga.
    const paymentStatus = 'PAID'; 

    // 4. Simpan ke Database (Transaksi)
    await prisma.$transaction(async (tx) => {
        // Update Booking
        await tx.booking.update({
            where: { id },
            data: {
                checkOut: now,
                baseFee: finalBaseFee, 
                lateFee: lateFee,      
                itemChargeFee: chargesFee,
                totalFee: totalFee,
                paymentMethod,
                paymentStatus: paymentStatus as any, // <--- INI KUNCINYA
                checkedOutById: session.user.id
            }
        });

        // Insert Detail Sanksi (Jika ada)
        if (charges && charges.length > 0) {
            await tx.bookingCharge.createMany({
                data: charges.map((c: any) => ({
                    bookingId: id,
                    chargeableItemId: c.chargeableItemId,
                    quantity: c.quantity,
                    chargeAtMoment: c.itemPrice 
                }))
            });
        }

        // Update Kamar jadi Available
        await tx.room.update({
            where: { id: booking.roomId },
            data: { status: 'AVAILABLE' }
        });
    });

    return NextResponse.json({ message: 'Check-out berhasil & Lunas' });

  } catch (error) {
    console.error("Check-out Error:", error);
    return new NextResponse('Gagal memproses check-out', { status: 500 });
  }
}