import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import WhatsappButton from "@/components/WhatsappButton";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { LogOut } from 'lucide-react';

async function getActiveBookings() {
  const res = await fetch('http://localhost:3000/api/bookings/active', { cache: 'no-store' });
  if (!res.ok) throw new Error('Gagal mengambil data');
  return res.json();
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
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking: any) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">{booking.room.roomNumber}</TableCell>
                <TableCell>{booking.guestName}</TableCell>
                <TableCell>{booking.studentName}</TableCell>
                <TableCell>{booking.addressLabel || '-'}</TableCell>
                <TableCell>{format(new Date(booking.checkIn), 'dd MMM, HH:mm')}</TableCell>
                <TableCell>{format(new Date(booking.expectedCheckOut), 'dd MMM, HH:mm')}</TableCell>
                <TableCell>
                  {/* --- PERUBAHAN DI SINI --- */}
                  <div className="flex items-center space-x-2">
                    <WhatsappButton
                      guestName={booking.guestName}
                      guestPhone={booking.guestPhone}
                      expectedCheckOut={booking.expectedCheckOut}
                    />
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