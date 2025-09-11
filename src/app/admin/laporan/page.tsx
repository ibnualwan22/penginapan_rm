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
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';

type Transaction = {
  paymentMethod: string;
  paymentStatus: string;
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

  // Calculate payment method totals
  const getTotalByPaymentMethod = () => {
    const cashTotal = transactions
      .filter(trx => trx.paymentMethod === 'CASH')
      .reduce((sum, trx) => sum + trx.totalFee, 0);
    
    const transferTotal = transactions
      .filter(trx => trx.paymentMethod === 'TRANSFER')
      .reduce((sum, trx) => sum + trx.totalFee, 0);
    
    const otherTotal = transactions
      .filter(trx => trx.paymentMethod !== 'CASH' && trx.paymentMethod !== 'TRANSFER')
      .reduce((sum, trx) => sum + trx.totalFee, 0);
    
    const grandTotal = transactions.reduce((sum, trx) => sum + trx.totalFee, 0);
    
    return { cashTotal, transferTotal, otherTotal, grandTotal };
  };

  const handleExportExcel = () => {
    if (transactions.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    // Hitung total berdasarkan metode pembayaran
    const { cashTotal, transferTotal, otherTotal, grandTotal } = getTotalByPaymentMethod();

    // Buat data untuk Excel
    const excelData = [
      // Header
      ['No', 'Nomor Kamar', 'Nama Wali', 'No. HP', 'Alamat', 'Nama Santri', 
       'Check-in', 'Penerima Check-in', 'Check-out', 'Penerima Check-out', 
       'Paket', 'Metode Bayar', 'Status Bayar', 'Total Biaya'],
      
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
        trx.paymentMethod || '',
        trx.paymentStatus === 'PAID' ? 'Lunas' : trx.paymentStatus === 'UNPAID' ? 'Belum Lunas' : '',
        trx.totalFee
      ]),
      
      // Baris kosong
      [],
      
      // Ringkasan total
      ['', '', '', '', '', '', '', '', '', '', '', '', 'TOTAL CASH:', cashTotal],
      ['', '', '', '', '', '', '', '', '', '', '', '', 'TOTAL TRANSFER:', transferTotal],
      ...(otherTotal > 0 ? [['', '', '', '', '', '', '', '', '', '', '', '', 'TOTAL LAINNYA:', otherTotal]] : []),
      ['', '', '', '', '', '', '', '', '', '', '', '', 'TOTAL KESELURUHAN:', grandTotal]
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
      { wch: 15 },  // Metode Bayar
      { wch: 12 },  // Status Bayar
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

    // Hitung total berdasarkan metode pembayaran
    const { cashTotal, transferTotal, otherTotal, grandTotal } = getTotalByPaymentMethod();

    const headers = [
      'No', 'Nomor Kamar', 'Nama Wali', 'No. HP', 'Alamat', 'Nama Santri',
      'Check-in', 'Penerima Check-in', 'Check-out', 'Penerima Check-out',
      'Paket', 'Metode Bayar', 'Status Bayar', 'Total Biaya'
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
      trx.paymentMethod || '',
      trx.paymentStatus === 'PAID' ? 'Lunas' : trx.paymentStatus === 'UNPAID' ? 'Belum Lunas' : '',
      `Rp ${trx.totalFee.toLocaleString('id-ID')}`
    ].join(','));

    // Tambahkan ringkasan total
    rows.push('');
    rows.push(`"","","","","","","","","","","","","TOTAL CASH:",${cashTotal}`);
    rows.push(`"","","","","","","","","","","","","TOTAL TRANSFER:",${transferTotal}`);
    if (otherTotal > 0) {
      rows.push(`"","","","","","","","","","","","","TOTAL LAINNYA:",${otherTotal}`);
    }
    rows.push(`"","","","","","","","","","","","","TOTAL KESELURUHAN:",${grandTotal}`);

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

  const { cashTotal, transferTotal, otherTotal, grandTotal } = getTotalByPaymentMethod();

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
      
      {/* Tampilkan ringkasan dengan breakdown metode pembayaran */}
      {transactions.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Total Transaksi:</span>
                <span className="font-semibold text-blue-800">{transactions.length} item</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Total Cash:</span>
                <span className="font-semibold text-green-700">Rp {cashTotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Total Transfer:</span>
                <span className="font-semibold text-orange-700">Rp {transferTotal.toLocaleString('id-ID')}</span>
              </div>
              {otherTotal > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Total Lainnya:</span>
                  <span className="font-semibold text-purple-700">Rp {otherTotal.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end items-center">
              <div className="text-right">
                <div className="text-sm text-blue-700 mb-1">Total Keseluruhan</div>
                <div className="text-2xl font-bold text-blue-900">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Dialog open={!!selectedTransaction} onOpenChange={(isOpen) => !isOpen && setSelectedTransaction(null)}>
        {/* Table Container with Responsive Scroll */}
        <div className="rounded-lg border bg-white shadow-sm">
          {/* Mobile: Show table info */}
          <div className="sm:hidden p-4 border-b bg-gray-50">
            <p className="text-sm text-gray-600">
              Geser ke samping untuk melihat lebih banyak kolom →
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <div className="min-w-full inline-block align-middle">
              <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">No.</TableHead>
                    <TableHead className="min-w-[80px]">Kamar</TableHead>
                    <TableHead className="min-w-[120px]">Nama Wali</TableHead>
                    <TableHead className="min-w-[100px] hidden sm:table-cell">No. HP</TableHead>
                    <TableHead className="min-w-[150px] hidden lg:table-cell">Alamat</TableHead>
                    <TableHead className="min-w-[120px]">Nama Santri</TableHead>
                    <TableHead className="min-w-[120px]">Check-in</TableHead>
                    <TableHead className="min-w-[100px] hidden md:table-cell">Penerima</TableHead>
                    <TableHead className="min-w-[120px] hidden sm:table-cell">Check-out</TableHead>
                    <TableHead className="min-w-[100px] hidden md:table-cell">Penerima</TableHead>
                    <TableHead className="min-w-[100px] hidden sm:table-cell">Paket</TableHead>
                    <TableHead className="min-w-[100px]">Metode</TableHead>
                    <TableHead className="min-w-[80px] hidden sm:table-cell">Status</TableHead>
                    <TableHead className="min-w-[120px] text-right">Total</TableHead>
                    <TableHead className="w-20 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={15} className="text-center h-24">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span>Memuat data...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : transactions.length > 0 ? (
                    transactions.map((trx: Transaction, index) => (
                      <TableRow key={trx.id} className="hover:bg-gray-50">
                        <TableCell className="text-center font-medium">{index + 1}</TableCell>
                        <TableCell className="font-medium">{trx.room.roomNumber}</TableCell>
                        <TableCell className="max-w-[120px] truncate" title={trx.guestName}>
                          {trx.guestName}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{trx.guestPhone || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell max-w-[150px] truncate" title={trx.addressLabel || '-'}>
                          {trx.addressLabel || '-'}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate" title={trx.studentName}>
                          {trx.studentName}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="space-y-1">
                            <div>{format(new Date(trx.checkIn), 'dd MMM')}</div>
                            <div className="text-xs text-gray-500">{format(new Date(trx.checkIn), 'HH:mm')}</div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{trx.checkedInBy.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">
                          {trx.checkOut ? (
                            <div className="space-y-1">
                              <div>{format(new Date(trx.checkOut), 'dd MMM')}</div>
                              <div className="text-xs text-gray-500">{format(new Date(trx.checkOut), 'HH:mm')}</div>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{trx.checkedOutBy?.name || '-'}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">
                          {trx.bookingType === 'FULL_DAY' ? 'Harian' : 'Setengah Hari'}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className={`px-2 py-1 rounded text-xs font-medium text-center ${
                            trx.paymentMethod === 'CASH' ? 'bg-green-100 text-green-800' : 
                            trx.paymentMethod === 'TRANSFER' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {trx.paymentMethod || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {trx.paymentStatus === 'PAID' ? (
                            <Badge variant="default" className="text-xs">Lunas</Badge>
                          ) : trx.paymentStatus === 'UNPAID' ? (
                            <Badge variant="destructive" className="text-xs">Belum Lunas</Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          <div className="space-y-1">
                            <div className="text-sm">Rp {trx.totalFee.toLocaleString('id-ID')}</div>
                            {/* Mobile: Show payment status here */}
                            <div className="sm:hidden">
                              {trx.paymentStatus === 'PAID' ? (
                                <Badge variant="default" className="text-xs">Lunas</Badge>
                              ) : trx.paymentStatus === 'UNPAID' ? (
                                <Badge variant="destructive" className="text-xs">Belum</Badge>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setSelectedTransaction(trx)}
                              className="text-xs px-2 py-1"
                            >
                              Detail
                            </Button>
                          </DialogTrigger>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                      <TableRow>
                        <TableCell colSpan={15} className="text-center h-24">
                          <div className="flex flex-col items-center space-y-2">
                            <div className="text-gray-400">📄</div>
                            <span className="text-gray-500">Tidak ada data transaksi</span>
                          </div>
                        </TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {/* Mobile: Show additional info */}
          {transactions.length > 0 && (
            <div className="sm:hidden p-4 border-t bg-gray-50 text-xs text-gray-600">
              <p>💡 Tap "Detail" untuk melihat informasi lengkap transaksi</p>
            </div>
          )}
        </div>
        
        {selectedTransaction && <TransactionDetailModal transaction={selectedTransaction} />}
      </Dialog>
    </div>
  );
}