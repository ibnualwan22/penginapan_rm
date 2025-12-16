'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Receipt, Wallet, Banknote, Clock, MessageCircle } from 'lucide-react';

export default function CheckOutPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<any>(null);
  const [chargeItems, setChargeItems] = useState<any[]>([]);
  const [addedCharges, setAddedCharges] = useState<any[]>([]);
  
  const [selectedChargeId, setSelectedChargeId] = useState<string>('');
  const [chargeQty, setChargeQty] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resBooking, resCharges] = await Promise.all([
          fetch(`/api/bookings/${bookingId}`),
          fetch('/api/chargeable-items')
        ]);

        if (resBooking.ok) {
            const data = await resBooking.json();
            setBooking(data);
            if(data.paymentMethod) setPaymentMethod(data.paymentMethod);
        }
        if (resCharges.ok) setChargeItems(await resCharges.json());
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [bookingId]);

  const handleAddCharge = () => {
    if (!selectedChargeId) return;
    const item = chargeItems.find(c => c.id === selectedChargeId);
    if (item) {
      setAddedCharges(prev => [
        ...prev, 
        { chargeableItemId: item.id, quantity: chargeQty, itemName: item.itemName, itemPrice: item.itemPrice || item.chargeAmount * chargeQty }
      ]);
      setChargeQty(1);
    }
  };

  const handleRemoveCharge = (index: number) => {
    setAddedCharges(prev => prev.filter((_, i) => i !== index));
  };

  // --- HITUNGAN FRONTEND ---
  const sim = booking?.simulation || { totalBillActual: 0, amountPaid: 0, durationDesc: '-', note: '' };
  const chargesTotal = addedCharges.reduce((acc, curr) => acc + curr.itemPrice, 0);
  const finalTotalToPay = (booking?.room?.property?.isFree ? 0 : sim.totalBillActual) + chargesTotal;
  const finalRemaining = finalTotalToPay - (booking?.amountPaid || 0);

  // --- LOGIC KIRIM WA NOTA ---
  const sendCheckoutWhatsApp = () => {
    if (!booking.guestPhone) return;

    let phone = booking.guestPhone.trim();
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);

    const now = new Date();
    const isFree = booking.room.property.isFree;

    // Susun status pembayaran
    let paymentStatusText = '';
    if (isFree) {
        paymentStatusText = '✅ *GRATIS (Fasilitas)*';
    } else {
        if (finalRemaining < 0) {
            paymentStatusText = `✅ *LUNAS* (Kembalian: Rp ${Math.abs(finalRemaining).toLocaleString('id-ID')})`;
        } else if (finalRemaining === 0) {
             paymentStatusText = '✅ *LUNAS*';
        } else {
             paymentStatusText = `⚠️ *Sisa Bayar:* Rp ${finalRemaining.toLocaleString('id-ID')} (LUNAS)`;
        }
    }

    const message = [
        `🧾 *NOTA CHECK-OUT*`,
        `${booking.room.property.name}`,
        '',
        `Yth. Bapak/Ibu *${booking.guestName}*,`,
        `👤 Santri: ${booking.studentName || '-'}`, // [BARU] Nama Santri
        '',
        'Terima kasih telah mempercayakan istirahat Anda kepada kami.',
        '',
        '*Rincian Menginap:*',
        `🛏️ Kamar: ${booking.room.roomNumber}`,
        `📥 Check-in: ${format(new Date(booking.checkIn), 'dd MMM yyyy, HH:mm', { locale: localeID })}`,
        `📤 Check-out: ${format(now, 'dd MMM yyyy, HH:mm', { locale: localeID })}`,
        `⏱️ Durasi Menginap: ${sim.durationDesc}`,
        // [BARU] Tampilkan catatan denda waktu jika ada (misal: "Sisa 2 jam")
        sim.note ? `ℹ️ Info Waktu: ${sim.note}` : null, 
        '',
        '*Rincian Biaya:*',
        isFree ? '- Biaya Sewa: GRATIS' : `- Biaya Sewa (Aktual): Rp ${sim.totalBillActual.toLocaleString('id-ID')}`,
        // [BARU] Tampilkan denda barang secara eksplisit
        chargesTotal > 0 ? `- Denda Kerusakan/Barang: Rp ${chargesTotal.toLocaleString('id-ID')}` : null,
        !isFree ? `- Total Tagihan: Rp ${finalTotalToPay.toLocaleString('id-ID')}` : null,
        !isFree ? `- Sudah Dibayar (DP): Rp ${(booking.amountPaid || 0).toLocaleString('id-ID')}` : null,
        '',
        `*STATUS: ${paymentStatusText}*`,
        '',
        'Apabila ada barang yang tertinggal atau membutuhkan bantuan, silakan hubungi:',
        '',
        '☕ Cafe Arwana: 6288215278401',
        '🏨 Resepsionis Hotel RM: 6285842817105',
        '🚗 Mobil Pelayanan Tamu: 62882007534377 / 6282323745184',
        '',
        '🙏 *Jazakumullah Khairan Katsiran*',
        'Selamat jalan dan semoga selamat sampai tujuan.'
    ].filter(Boolean).join('\n');

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCheckout = async () => {
    if(!confirm("Pastikan pembayaran sudah beres. Lanjutkan Check-out?")) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            paymentMethod: booking.room.property.isFree ? null : paymentMethod,
            charges: addedCharges
        }),
      });

      if (!res.ok) throw new Error('Gagal update database');

      // 1. Kirim WA (Jika ada nomor HP)
      if (booking.guestPhone) {
        sendCheckoutWhatsApp();
      }

      // 2. Redirect
      router.push('/admin'); 
      router.refresh();
      
    } catch (err: any) {
      alert('Gagal check-out: ' + err.message);
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto"/> Menghitung tagihan...</div>;
  if (!booking) return <div className="p-10 text-center text-red-500">Data tidak ditemukan</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Receipt className="h-6 w-6"/> Konfirmasi Check-Out & Pembayaran
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* KOLOM KIRI: INFO & DURASI */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-gray-50 pb-3"><CardTitle>Informasi Menginap</CardTitle></CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500">Tamu</span> <span className="col-span-2 font-medium">: {booking.guestName}</span>
                    <span className="text-gray-500">Kamar</span> <span className="col-span-2 font-medium">: {booking.room.roomNumber}</span>
                    <span className="text-gray-500">Check-In</span> <span className="col-span-2">: {format(new Date(booking.checkIn), 'dd MMM, HH:mm', { locale: localeID })}</span>
                    <span className="text-gray-500">Check-Out</span> <span className="col-span-2 font-bold text-blue-600">: SEKARANG</span>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mt-2">
                    <p className="font-semibold flex items-center gap-2 text-blue-800">
                        <Clock className="w-4 h-4" /> Durasi Aktual: {sim.durationDesc}
                    </p>
                    {sim.note && (
                        <p className="text-xs text-orange-600 mt-1 font-medium bg-orange-50 p-1 rounded inline-block">
                           {sim.note}
                        </p>
                    )}
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle>Denda Kerusakan / Barang</CardTitle></CardHeader>
            <CardContent className="pt-2 space-y-4">
               <div className="flex gap-2">
                  <Select value={selectedChargeId} onValueChange={setSelectedChargeId}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Pilih Item..." /></SelectTrigger>
                    <SelectContent>
                      {chargeItems.map((item: any) => (
                        <SelectItem key={item.id} value={item.id}>{item.itemName} (+{item.chargeAmount.toLocaleString()})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="number" min={1} className="w-20" value={chargeQty} onChange={e => setChargeQty(Number(e.target.value))} />
               </div>
               <Button variant="secondary" onClick={handleAddCharge} disabled={!selectedChargeId} className="w-full">Tambah</Button>
               
               {addedCharges.length > 0 && (
                 <ul className="space-y-2 mt-2">
                   {addedCharges.map((c, i) => (
                     <li key={i} className="flex justify-between bg-gray-50 p-2 rounded text-sm">
                        <span>{c.quantity}x {c.itemName}</span>
                        <div className="flex gap-3">
                            <b>Rp {c.itemPrice.toLocaleString()}</b>
                            <button onClick={() => handleRemoveCharge(i)} className="text-red-500 font-bold">x</button>
                        </div>
                     </li>
                   ))}
                 </ul>
               )}
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN: TAGIHAN */}
        <div className="space-y-6">
            <Card className="border-t-4 border-t-primary shadow-lg">
                <CardHeader className="bg-primary/5 pb-4">
                    <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5"/> Tagihan Akhir</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    
                    <div className="flex justify-between items-center text-lg">
                        <span className="text-gray-700">Biaya Sewa (Aktual)</span>
                        <span className="font-bold">Rp {booking.room.property.isFree ? 0 : sim.totalBillActual.toLocaleString('id-ID')}</span>
                    </div>

                    {chargesTotal > 0 && (
                        <div className="flex justify-between items-center text-orange-600">
                            <span>Sanksi Barang</span>
                            <span>+ Rp {chargesTotal.toLocaleString('id-ID')}</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center text-green-600 bg-green-50 p-2 rounded">
                        <span className="flex items-center gap-1"><Banknote className="h-4 w-4"/> Sudah Dibayar (DP)</span>
                        <span className="font-semibold">- Rp {(booking.amountPaid || 0).toLocaleString('id-ID')}</span>
                    </div>

                    <Separator className="border-dashed my-2"/>

                    <div className="flex justify-between items-center text-xl font-extrabold text-blue-900 bg-blue-50 p-4 rounded-lg">
                        <span>{finalRemaining >= 0 ? "KEKURANGAN" : "KEMBALIAN"}</span>
                        <span>{finalRemaining < 0 ? "-" : ""} Rp {Math.abs(finalRemaining).toLocaleString('id-ID')}</span>
                    </div>

                    {!booking.room.property.isFree && finalRemaining > 0 && (
                        <div className="mt-4">
                            <Label>Metode Pelunasan</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASH">Tunai (Cash)</SelectItem>
                                    <SelectItem value="TRANSFER">Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={handleCheckout} disabled={isSubmitting} size="lg" className="w-full bg-blue-700 hover:bg-blue-800">
                        {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : (
                           <span className="flex items-center">
                             Konfirmasi & Kirim Nota WA <MessageCircle className="ml-2 h-4 w-4" />
                           </span>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}