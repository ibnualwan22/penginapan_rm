'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, Download } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import TransactionDetailModal from '@/components/reports/TransactionDetailModal';
import * as XLSX from 'xlsx';

type Transaction = {
  id: string;
  guestName: string;
  guestPhone: string | null;
  studentName: string;
  addressLabel: string | null;
  checkIn: string;
  checkOut: string | null;
  bookingType: string;
  totalFee: number;
  room: {
    roomNumber: string;
  };
  checkedInBy: {
    name: string;
  };
  checkedOutBy: {
    name: string;
  } | null;
};

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchTransactions = async (from?: Date, to?: Date) => {
    setIsLoading(true);
    let url = '/api/laporan/transactions';
    if (from && to) {
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
        setTransactions([]);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleFilter = () => {
    fetchTransactions(dateRange?.from, dateRange?.to);
  };

  const handleExportExcel = () => {
    if (transactions.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    // Hitung total akumulasi
    const totalAccumulation = transactions.reduce((sum, trx) => sum + trx.totalFee, 0);

    // Buat data untuk Excel
    const excelData = [
      // Header
      ['No', 'Nomor Kamar', 'Nama Wali', 'No. HP', 'Alamat', 'Nama Santri', 
       'Check-in', 'Penerima Check-in', 'Check-out', 'Penerima Check-out', 
       'Paket', 'Total Biaya'],
      
      // Data transaksi
      ...transactions.map((trx: Transaction, index: number) => [
        index + 1,
        trx.room.roomNumber,
        trx.guestName,
        trx.guestPhone || '',
        trx.addressLabel || '',
        trx.studentName,
        format(new Date(trx.checkIn), 'yyyy-MM-dd HH:mm'),
        trx.checkedInBy.name,
        trx.checkOut ? format(new Date(trx.checkOut), 'yyyy-MM-dd HH:mm') : '',
        trx.checkedOutBy?.name || '',
        trx.bookingType === 'FULL_DAY' ? 'Harian' : 'Setengah Hari',
        trx.totalFee
      ]),
      
      // Baris kosong
      [],
      
      // Total akumulasi
      ['', '', '', '', '', '', '', '', '', '', 'TOTAL KESELURUHAN:', totalAccumulation]
    ];

    // Buat workbook dan worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Set lebar kolom
    const columnWidths = [
      { wch: 5 },   // No
      { wch: 12 },  // Nomor Kamar
      { wch: 20 },  // Nama Wali
      { wch: 15 },  // No. HP
      { wch: 25 },  // Alamat
      { wch: 20 },  // Nama Santri
      { wch: 18 },  // Check-in
      { wch: 15 },  // Penerima Check-in
      { wch: 18 },  // Check-out
      { wch: 15 },  // Penerima Check-out
      { wch: 12 },  // Paket
      { wch: 15 }   // Total Biaya
    ];
    ws['!cols'] = columnWidths;

    // Tambahkan worksheet ke workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Transaksi');

    // Generate nama file
    const fileName = `laporan_transaksi_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    
    // Download file
    XLSX.writeFile(wb, fileName);
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    const headers = [
      'No', 'Nomor Kamar', 'Nama Wali', 'No. HP', 'Alamat', 'Nama Santri',
      'Check-in', 'Penerima Check-in', 'Check-out', 'Penerima Check-out',
      'Paket', 'Total Biaya'
    ];
    
    const rows = transactions.map((trx: Transaction, index: number) => [
      index + 1,
      trx.room.roomNumber,
      `"${trx.guestName}"`,
      trx.guestPhone || '',
      `"${trx.addressLabel || ''}"`,
      `"${trx.studentName}"`,
      format(new Date(trx.checkIn), 'yyyy-MM-dd HH:mm'),
      trx.checkedInBy.name,
      trx.checkOut ? format(new Date(trx.checkOut), 'yyyy-MM-dd HH:mm') : '',
      trx.checkedOutBy?.name || '',
      trx.bookingType === 'FULL_DAY' ? 'Harian' : 'Setengah Hari',
      `Rp ${trx.totalFee.toLocaleString('id-ID')}`
    ].join(','));

    // Tambahkan total akumulasi
    const totalAccumulation = transactions.reduce((sum, trx) => sum + trx.totalFee, 0);
    rows.push('');
    rows.push(`"","","","","","","","","","","TOTAL KESELURUHAN:",${totalAccumulation}`);

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      const fileName = `laporan_transaksi_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
                  />
                </PopoverContent>
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
                  />
                </PopoverContent>
            </Popover>
            <Button onClick={handleFilter}>Filter</Button>
            <Button onClick={handleExportExcel} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Ekspor ke Excel (XLSX)
            </Button>
            {/* <Button onClick={handleExportCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Ekspor ke CSV
            </Button> */}
        </div>
      </div>
      
      {/* Tampilkan total akumulasi di UI juga */}
      {transactions.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-700">Total Transaksi: {transactions.length} item</span>
            <span className="text-lg font-bold text-blue-800">
              Total Keseluruhan: Rp {transactions.reduce((sum, trx) => sum + trx.totalFee, 0).toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      )}
      
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
                  transactions.map((trx: Transaction, index) => (
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