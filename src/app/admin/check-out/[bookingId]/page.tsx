'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Tipe data untuk item sanksi
type ChargeableItem = {
  id: string;
  itemName: string;
  chargeAmount: number;
};

// Tipe data untuk sanksi yang ditambahkan
type AddedCharge = {
  chargeableItemId: string;
  quantity: number;
  itemName: string;
  itemPrice: number;
};

export default function CheckOutPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk fitur perpanjangan durasi
  const [extensionType, setExtensionType] = useState<'FULL_DAY' | 'HALF_DAY'>('FULL_DAY');
  const [extensionDuration, setExtensionDuration] = useState(1);
  
  // State untuk fitur sanksi
  const [chargeableItems, setChargeableItems] = useState<ChargeableItem[]>([]);
  const [selectedChargeId, setSelectedChargeId] = useState<string>('');
  const [addedCharges, setAddedCharges] = useState<AddedCharge[]>([]);

  useEffect(() => {
    if (bookingId) {
      const fetchData = async () => {
        setIsLoading(true);
        const [bookingRes, itemsRes] = await Promise.all([
          fetch(`/api/bookings/${bookingId}`),
          fetch('/api/chargeable-items')
        ]);

        if (bookingRes.ok) {
          const bookingData = await bookingRes.json();
          setBooking(bookingData);
        }

        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          setChargeableItems(itemsData);
        }
        
        setIsLoading(false);
      };
      fetchData();
    }
  }, [bookingId]);

  const handleExtendStay = async () => {
    setIsLoading(true);
    const res = await fetch(`/api/bookings/${bookingId}/extend`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ extensionType, duration: extensionDuration }),
    });
    if (res.ok) {
        const updatedBooking = await res.json();
        setBooking(updatedBooking); // Perbarui data di halaman
    }
    setIsLoading(false);
  };
  
  const handleAddCharge = () => {
    const selectedItem = chargeableItems.find(item => item.id === selectedChargeId);
    if (selectedItem) {
      setAddedCharges(prev => [
        ...prev,
        {
          chargeableItemId: selectedItem.id,
          quantity: 1,
          itemName: selectedItem.itemName,
          itemPrice: selectedItem.chargeAmount,
        }
      ]);
      setSelectedChargeId(''); // Reset dropdown
    }
  };

  const handleCheckout = async () => {
    setIsLoading(true);
    await fetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        charges: addedCharges.map(({ chargeableItemId, quantity }) => ({ chargeableItemId, quantity })),
      }),
    });
    router.push('/admin');
    router.refresh();
  };
  
  if (isLoading || !booking) {
    return <p className="p-8">Memuat detail booking...</p>;
  }

  // Kalkulasi biaya dinamis
  const chargesFee = addedCharges.reduce((total, charge) => total + charge.itemPrice * charge.quantity, 0);
  const now = new Date();
  const hoursDifference = Math.max(0, Math.ceil((now.getTime() - new Date(booking.expectedCheckOut).getTime()) / 3600000));
  const currentLateFee = hoursDifference * 20000;
  const currentTotal = booking.baseFee + currentLateFee + chargesFee;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader><CardTitle>Detail Booking & Check-out</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <p><strong>Nomor Kamar:</strong> {booking.room.roomNumber}</p>
            <p><strong>Nama Wali Santri:</strong> {booking.guestName}</p>
            <p><strong>Nama Santri:</strong> {booking.studentName}</p>
            <p><strong>Waktu Check-in:</strong> {format(new Date(booking.checkIn), 'dd MMM yyyy, HH:mm')}</p>
            <p><strong>Seharusnya Check-out:</strong> {format(new Date(booking.expectedCheckOut), 'dd MMM yyyy, HH:mm')}</p>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Perpanjang Durasi Menginap</h3>
            <div className="grid grid-cols-3 items-end gap-2">
              <div className="col-span-3 sm:col-span-1">
                  <Label>Tipe</Label>
                  <Select value={extensionType} onValueChange={(v) => setExtensionType(v as 'FULL_DAY' | 'HALF_DAY')}>
                      <SelectTrigger><SelectValue placeholder="Pilih durasi..." /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="FULL_DAY">Per Hari</SelectItem>
                          <SelectItem value="HALF_DAY">Setengah Hari</SelectItem>
                      </SelectContent>
                  </Select>
              </div>

              {extensionType === 'FULL_DAY' && (
                <div className="col-span-3 sm:col-span-1">
                    <Label>Jumlah Hari</Label>
                    <Input type="number" value={extensionDuration} onChange={(e) => setExtensionDuration(parseInt(e.target.value))} min="1" />
                </div>
              )}
              
              <div className="col-span-3 sm:col-span-1">
                <Button onClick={handleExtendStay} variant="outline" className="w-full" disabled={isLoading}>
                  Tambah Durasi
                </Button>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Tambah Sanksi / Biaya Tambahan</h3>
            <div className="flex items-center space-x-2">
              <Select onValueChange={setSelectedChargeId} value={selectedChargeId}>
                <SelectTrigger><SelectValue placeholder="Pilih item..." /></SelectTrigger>
                <SelectContent>
                  {chargeableItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>{item.itemName} - Rp {item.chargeAmount.toLocaleString('id-ID')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddCharge} disabled={!selectedChargeId}>Tambah</Button>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-secondary rounded-lg space-y-2">
            <h3 className="font-semibold mb-2">Rincian Biaya</h3>
            <div className="flex justify-between text-sm"><span>Tarif Dasar:</span> <span>Rp {booking.baseFee.toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between text-sm"><span>Denda Keterlambatan:</span> <span className="text-destructive">Rp {currentLateFee.toLocaleString('id-ID')}</span></div>
            {addedCharges.map((charge, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>Sanksi ({charge.itemName}):</span>
                <span>Rp {charge.itemPrice.toLocaleString('id-ID')}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-lg mt-2 border-t pt-2"><span>Total Tagihan:</span> <span>Rp {currentTotal.toLocaleString('id-ID')}</span></div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleCheckout} disabled={isLoading} className="w-full" size="lg">
            {isLoading ? 'Memproses...' : 'Konfirmasi & Selesaikan Check-out'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}