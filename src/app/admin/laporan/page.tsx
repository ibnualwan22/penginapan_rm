import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';

async function getTransactions() {
  // Kita panggil API yang baru dibuat
  const res = await fetch('http://localhost:3000/api/laporan/transactions', {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Gagal mengambil data transaksi');
  }
  return res.json();
}

export default async function ReportsPage() {
  const transactions = await getTransactions();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Laporan Transaksi</h1>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomor Kamar</TableHead>
              <TableHead>Nama Wali Santri</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead className="text-right">Total Tagihan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((trx: any) => (
              <TableRow key={trx.id}>
                <TableCell>{trx.room.roomNumber}</TableCell>
                <TableCell>{trx.guestName}</TableCell>
                <TableCell>{format(new Date(trx.checkIn), 'dd MMM yyyy, HH:mm')}</TableCell>
                <TableCell>{format(new Date(trx.checkOut), 'dd MMM yyyy, HH:mm')}</TableCell>
                <TableCell className="text-right">Rp {trx.totalFee.toLocaleString('id-ID')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}