import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import WhatsappButton from "@/components/WhatsappButton";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { LogOut } from 'lucide-react';
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ExtendBookingModal from '@/components/bookings/ExtendBookingModal';

// --- HELPER FUNCTION: FORMAT WIB (ASIA/JAKARTA) ---
const formatWIB = (dateString: Date | string) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  
  // Gunakan API bawaan browser/node untuk konversi zona waktu ke Asia/Jakarta
  const formatted = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta', // KUNCI UTAMA: Paksa ke Jakarta (UTC+7)
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

  // Ubah pemisah waktu dari titik (.) menjadi titik dua (:) agar lebih rapi
  // Contoh output: "17 Des, 14:00"
  return formatted.replace(/\./g, ':'); 
};

// --- DATA FETCHING ---
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
      isExtraHalfDay: true, 
      
      // Ambil detail kamar lengkap untuk keperluan Modal Perpanjang & Logika Bisnis
      room: {
        select: {
          id: true,
          roomNumber: true,
          propertyId: true,
          property: {
            select: { id: true, name: true, isFree: true }
          },
          roomType: {
            select: { id: true, name: true, priceFullDay: true, priceHalfDay: true }
          }
        }
      },
    },
    orderBy: { checkIn: 'asc' },
  });
}

// --- MAIN COMPONENT ---
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
                <TableCell className="font-medium">{booking.room.roomNumber}</TableCell>
                <TableCell>{booking.guestName}</TableCell>
                <TableCell>{booking.studentName || '-'}</TableCell>
                <TableCell>{booking.addressLabel || '-'}</TableCell>
                
                {/* Gunakan formatWIB agar jam sesuai dengan zona waktu Indonesia */}
                <TableCell>{formatWIB(booking.checkIn)}</TableCell>
                <TableCell>{formatWIB(booking.expectedCheckOut)}</TableCell>
                
                <TableCell>
                    {booking.bookingType === 'FULL_DAY' ? 'Harian' : 'Setengah Hari'}
                    {booking.isExtraHalfDay && <span className="text-xs text-blue-600 block">+ ½ Hari</span>}
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <WhatsappButton
                      guestName={booking.guestName}
                      guestPhone={booking.guestPhone}
                      expectedCheckOut={booking.expectedCheckOut}
                    />
                    
                    {/* Modal Perpanjang */}
                    <ExtendBookingModal booking={booking} />
                    
                    {/* Tombol Check Out */}
                    <Button asChild size="sm" variant="default" className="bg-red-600 hover:bg-red-700">
                      <Link href={`/admin/check-out/${booking.id}`}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Check Out
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {bookings.length === 0 && (
                <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Tidak ada tamu yang sedang menginap.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}