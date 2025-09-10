'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import TransactionDetailModal from '@/components/reports/TransactionDetailModal';

export default function ReportsPage() {
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  

  const fetchTransactions = async (from?: Date, to?: Date) => {
    setIsLoading(true);
    let url = '/api/laporan/transactions';
    if (from && to) {
      // Tambahkan 1 hari ke tanggal 'to' agar inklusif sampai akhir hari
      const adjustedTo = new Date(to);
      adjustedTo.setDate(adjustedTo.getDate() + 1);
      url += `?from=${from.toISOString()}&to=${adjustedTo.toISOString()}`;
    }
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Gagal memuat data');
        const data = await res.json();
        setTransactions(data);
    } catch (error) {
        console.error(error);
        setTransactions([]); // Kosongkan data jika error
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(); // Ambil semua data saat pertama kali dimuat
  }, []);

  const handleFilter = () => {
    fetchTransactions(dateRange?.from, dateRange?.to);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Laporan Transaksi</h1>
        <div className="flex items-center space-x-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? format(dateRange.from, "PPP") : <span>Dari tanggal</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
<Calendar
  mode="single"
  selected={dateRange?.from}
  onSelect={(date) =>
    setDateRange((prev) => ({ ...(prev ?? {}), from: date ?? undefined } as DateRange))
  }
  initialFocus
/>                </PopoverContent>
            </Popover>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.to ? format(dateRange.to, "PPP") : <span>Sampai tanggal</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
<Calendar
  mode="single"
  selected={dateRange?.to}
  onSelect={(date) =>
    setDateRange((prev) => ({ ...(prev ?? {}), to: date ?? undefined } as DateRange))
  }
  initialFocus
/>                </PopoverContent>
            </Popover>
            <Button onClick={handleFilter}>Filter</Button>
        </div>
      </div>
      
      <Dialog open={!!selectedTransaction} onOpenChange={(isOpen) => !isOpen && setSelectedTransaction(null)}>
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>Kamar</TableHead>
                  <TableHead>Nama Wali</TableHead>
                  <TableHead>No. HP</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Nama Santri</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Penerima</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Penerima</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead className="text-right">Total Biaya</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={13} className="text-center h-24">Memuat data...</TableCell></TableRow>
                ) : transactions.length > 0 ? (
                  transactions.map((trx: any, index) => (
                    <TableRow key={trx.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{trx.room.roomNumber}</TableCell>
                      <TableCell>{trx.guestName}</TableCell>
                      <TableCell>{trx.guestPhone || '-'}</TableCell>
                      <TableCell>{trx.addressLabel || '-'}</TableCell>
                      <TableCell>{trx.studentName}</TableCell>
                      <TableCell>{format(new Date(trx.checkIn), 'dd MMM, HH:mm')}</TableCell>
                      <TableCell>{trx.checkedInBy.name}</TableCell>
                      <TableCell>{trx.checkOut ? format(new Date(trx.checkOut), 'dd MMM, HH:mm') : '-'}</TableCell>
                      <TableCell>{trx.checkedOutBy?.name || '-'}</TableCell>
                      <TableCell>{trx.bookingType === 'FULL_DAY' ? 'Harian' : 'Setengah Hari'}</TableCell>
                      <TableCell className="text-right">Rp {trx.totalFee.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-center">
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedTransaction(trx)}>
                            Detail
                          </Button>
                        </DialogTrigger>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                    <TableRow><TableCell colSpan={13} className="text-center h-24">Tidak ada data transaksi.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        {selectedTransaction && <TransactionDetailModal transaction={selectedTransaction} />}
      </Dialog>
    </div>
  );
}
