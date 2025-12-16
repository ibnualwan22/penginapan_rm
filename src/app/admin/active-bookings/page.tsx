import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import WhatsappButton from "@/components/WhatsappButton";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { LogOut } from 'lucide-react';
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ExtendBookingModal from '@/components/bookings/ExtendBookingModal';

async function getActiveBookings() {
  const session = await getServerSession(authOptions);
  const managedPropertyIds = session?.user?.managedProperties.map(p => p.id) || [];

  if (managedPropertyIds.length === 0) return [];

  return prisma.booking.findMany({
    where: {
      checkOut: null,
      room: {
        propertyId: { in: managedPropertyIds },
      },
    },
    select: {
      id: true,
      guestName: true,
      guestPhone: true,
      studentName: true,
      addressLabel: true,
      checkIn: true,
      expectedCheckOut: true,
      bookingType: true,
      isExtraHalfDay: true, // [TAMBAHAN PENTING] sertakan ini juga
      
      // --- PERBAIKAN DI SINI ---
      // Sebelumnya: room: { select: { roomNumber: true } }
      // Ubah menjadi seperti di bawah ini:
      room: {
        select: {
          id: true,
          roomNumber: true,
          propertyId: true,
          // WAJIB: Ambil data properti (untuk cek isFree)
          property: {
            select: { id: true, name: true, isFree: true }
          },
          // WAJIB: Ambil tipe kamar (untuk harga)
          roomType: {
            select: { id: true, name: true, priceFullDay: true, priceHalfDay: true }
          }
        }
      },
      // -------------------------
    },
    orderBy: { checkIn: 'asc' },
  });
}

export default async function ActiveBookingsPage() {
  const bookings = await getActiveBookings();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tamu Sedang Menginap</h1>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kamar</TableHead>
              <TableHead>Nama Wali</TableHead>
              <TableHead>Nama Santri</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Selesai Pada</TableHead>
              <TableHead>Paket</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking: any) => (
              <TableRow key={booking.id}>
                <TableCell>{booking.room.roomNumber}</TableCell>
                <TableCell>{booking.guestName}</TableCell>
                <TableCell>{booking.studentName}</TableCell>
                <TableCell>{booking.addressLabel || '-'}</TableCell>
                <TableCell>{format(new Date(booking.checkIn), 'dd MMM, HH:mm')}</TableCell>
                <TableCell>{format(new Date(booking.expectedCheckOut), 'dd MMM, HH:mm')}</TableCell>
                <TableCell>{booking.bookingType === 'FULL_DAY' ? 'Harian' : 'Setengah Hari'}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <WhatsappButton
                      guestName={booking.guestName}
                      guestPhone={booking.guestPhone}
                      expectedCheckOut={booking.expectedCheckOut}
                    />
                    <ExtendBookingModal booking={booking} />
                    <Button asChild size="sm">
                      <Link href={`/admin/check-out/${booking.id}`}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Check Out
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}