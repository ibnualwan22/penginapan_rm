'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export default function CheckOutPage({ params }: { params: { bookingId: string } }) {
  const router = useRouter();
  const { bookingId } = params;
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk fitur sanksi
  const [chargeableItems, setChargeableItems] = useState<ChargeableItem[]>([]);
  const [selectedChargeId, setSelectedChargeId] = useState<string>('');
  const [addedCharges, setAddedCharges] = useState<AddedCharge[]>([]);

  useEffect(() => {
    // Ambil detail booking dan daftar item sanksi secara bersamaan
    const fetchData = async () => {
      const [bookingRes, itemsRes] = await Promise.all([
        fetch(`/api/bookings/${bookingId}`),
        fetch('/api/chargeable-items')
      ]);
      const bookingData = await bookingRes.json();
      const itemsData = await itemsRes.json();

      setBooking(bookingData);
      setChargeableItems(itemsData);
      setIsLoading(false);
    };
    fetchData();
  }, [bookingId]);

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

  if (isLoading) return <p className="p-8">Memuat detail...</p>;
  if (!booking) return <p className="p-8">Booking tidak ditemukan.</p>;

  // Kalkulasi biaya dinamis
  const chargesFee = addedCharges.reduce((total, charge) => total + charge.itemPrice * charge.quantity, 0);
  const now = new Date();
  const hoursDifference = Math.max(0, Math.ceil((now.getTime() - new Date(booking.expectedCheckOut).getTime()) / 3600000));
  const currentLateFee = hoursDifference * 20000;
  const currentTotal = booking.baseFee + currentLateFee + chargesFee;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader><CardTitle>Konfirmasi Check-out</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* ... Detail booking tetap sama ... */}
          <div className="space-y-2 text-sm">
            <p><strong>Nomor Kamar:</strong> {booking.room.roomNumber}</p>
            <p><strong>Nama Wali Santri:</strong> {booking.guestName}</p>
            <p><strong>Nama Santri:</strong> {booking.studentName}</p>
          </div>

          {/* --- Bagian Tambah Sanksi --- */}
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
          
          {/* Rincian Biaya */}
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