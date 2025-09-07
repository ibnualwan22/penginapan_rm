'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react'; // Kita perlu install lucide-react


function convertToCSV(data: any[]) {
  const headers = ['Nomor Kamar', 'Nama Wali Santri', 'Nama Santri', 'Check-in', 'Check-out', 'Tarif Dasar', 'Denda', 'Total Tagihan'];
  const rows = data.map(trx => [
    trx.room.roomNumber,
    trx.guestName,
    trx.studentName,
    format(new Date(trx.checkIn), 'yyyy-MM-dd HH:mm'),
    format(new Date(trx.checkOut), 'yyyy-MM-dd HH:mm'),
    trx.baseFee,
    trx.lateFee || 0,
    trx.totalFee,
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}
export default function ReportsPage() {
  const [transactions, setTransactions] = useState([]);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async (from?: Date, to?: Date) => {
    setIsLoading(true);
    let url = '/api/laporan/transactions';
    if (from && to) {
      // Tambahkan 1 hari ke tanggal 'to' agar inklusif
      const adjustedTo = new Date(to);
      adjustedTo.setDate(adjustedTo.getDate() + 1);
      url += `?from=${from.toISOString()}&to=${adjustedTo.toISOString()}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    setTransactions(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTransactions(); // Ambil semua data saat pertama kali dimuat
  }, []);
  const handleExport = () => {
    if (transactions.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }
    const csvData = convertToCSV(transactions);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `laporan_transaksi_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  const handleFilter = () => {
    fetchTransactions(dateRange.from, dateRange.to);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Laporan Transaksi</h1>
        <div className="flex items-center space-x-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, "PPP") : <span>Dari tanggal</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dateRange.from} onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))} initialFocus />
                </PopoverContent>
            </Popover>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.to ? format(dateRange.to, "PPP") : <span>Sampai tanggal</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dateRange.to} onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))} initialFocus />
                </PopoverContent>
            </Popover>
            <Button onClick={handleFilter}>Filter</Button>
            <Button onClick={handleExport} variant="outline">Ekspor ke CSV</Button> {/* <-- Tombol Ekspor */}
        </div>
      </div>

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
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center">Memuat data...</TableCell></TableRow>
            ) : (
              transactions.map((trx: any) => (
                <TableRow key={trx.id}>
                  <TableCell>{trx.room.roomNumber}</TableCell>
                  <TableCell>{trx.guestName}</TableCell>
                  <TableCell>{format(new Date(trx.checkIn), 'dd MMM yyyy, HH:mm')}</TableCell>
                  <TableCell>{format(new Date(trx.checkOut), 'dd MMM yyyy, HH:mm')}</TableCell>
                  <TableCell className="text-right">Rp {trx.totalFee.toLocaleString('id-ID')}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}