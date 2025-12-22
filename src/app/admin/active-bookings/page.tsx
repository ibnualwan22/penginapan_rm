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
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Tamu Sedang Menginap</h1>
      
      {/* Desktop View - Hidden on Mobile */}
      <div className="hidden lg:block rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Kamar</TableHead>
              <TableHead className="whitespace-nowrap">Nama Wali</TableHead>
              <TableHead className="whitespace-nowrap">Nama Santri</TableHead>
              <TableHead className="whitespace-nowrap">Alamat</TableHead>
              <TableHead className="whitespace-nowrap">Check-in</TableHead>
              <TableHead className="whitespace-nowrap">Selesai Pada</TableHead>
              <TableHead className="whitespace-nowrap">Paket</TableHead>
              <TableHead className="whitespace-nowrap min-w-[300px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking: any) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium whitespace-nowrap">{booking.room.roomNumber}</TableCell>
                <TableCell className="whitespace-nowrap">{booking.guestName}</TableCell>
                <TableCell className="whitespace-nowrap">{booking.studentName || '-'}</TableCell>
                <TableCell className="whitespace-nowrap">{booking.addressLabel || '-'}</TableCell>
                <TableCell className="whitespace-nowrap">{formatWIB(booking.checkIn)}</TableCell>
                <TableCell className="whitespace-nowrap">{formatWIB(booking.expectedCheckOut)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {booking.bookingType === 'FULL_DAY' ? 'Harian' : 'Setengah Hari'}
                  {booking.isExtraHalfDay && <span className="text-xs text-blue-600 block">+ ½ Hari</span>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <WhatsappButton
                      guestName={booking.guestName}
                      guestPhone={booking.guestPhone}
                      expectedCheckOut={booking.expectedCheckOut}
                    />
                    <ExtendBookingModal booking={booking} />
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

      {/* Mobile View - Card Layout */}
      <div className="lg:hidden space-y-4">
        {bookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border rounded-lg">
            Tidak ada tamu yang sedang menginap.
          </div>
        ) : (
          bookings.map((booking: any) => (
            <div key={booking.id} className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
              {/* Header Card */}
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    Kamar {booking.room.roomNumber}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {booking.bookingType === 'FULL_DAY' ? 'Harian' : 'Setengah Hari'}
                    {booking.isExtraHalfDay && (
                      <span className="text-xs text-blue-600 ml-1">+ ½ Hari</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nama Wali:</span>
                  <span className="font-medium text-right">{booking.guestName}</span>
                </div>
                
                {booking.studentName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nama Santri:</span>
                    <span className="font-medium text-right">{booking.studentName}</span>
                  </div>
                )}
                
                {booking.addressLabel && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Alamat:</span>
                    <span className="font-medium text-right">{booking.addressLabel}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in:</span>
                  <span className="font-medium text-right">{formatWIB(booking.checkIn)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Selesai Pada:</span>
                  <span className="font-medium text-right">{formatWIB(booking.expectedCheckOut)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-3 border-t">
                <div className="flex gap-2">
                  <WhatsappButton
                    guestName={booking.guestName}
                    guestPhone={booking.guestPhone}
                    expectedCheckOut={booking.expectedCheckOut}
                  />
                  <ExtendBookingModal booking={booking} />
                </div>
                <Button asChild size="sm" variant="default" className="w-full bg-red-600 hover:bg-red-700">
                  <Link href={`/admin/check-out/${booking.id}`}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Check Out
                  </Link>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}