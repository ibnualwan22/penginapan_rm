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

  // Helper function untuk menghitung dan merinci denda
  const calculateLateFeeDetails = (booking: any) => {
      if (!booking || !booking.room) return { total: 0, breakdown: [] };

      const now = new Date();
      const totalLateHours = Math.max(0, Math.ceil((now.getTime() - new Date(booking.expectedCheckOut).getTime()) / 3600000));
      
      if (totalLateHours === 0) return { total: 0, breakdown: [] };

      const isSpecial = booking.room.type === 'SPECIAL';
      const rates = {
          hourlyRate: 20_000,
          halfDayRate: isSpecial ? 300_000 : 250_000,
          fullDayRate: isSpecial ? 350_000 : 300_000,
      };

      let lateFee = 0;
      const breakdown: { label: string, amount: number }[] = [];

      const fullDaysLate = Math.floor(totalLateHours / 24);
      if (fullDaysLate > 0) {
          const fee = fullDaysLate * rates.fullDayRate;
          lateFee += fee;
          breakdown.push({ label: `Tambah Paket ${fullDaysLate} Hari Penuh`, amount: fee });
      }

      const remainingHours = totalLateHours % 24;
      if (remainingHours > 0) {
          if (remainingHours <= 11) {
              const fee = remainingHours * rates.hourlyRate;
              lateFee += fee;
              breakdown.push({ label: `Denda ${remainingHours} Jam`, amount: fee });
          } else if (remainingHours <= 15) {
              const fee = rates.halfDayRate + ((remainingHours - 12) * rates.hourlyRate);
              lateFee += fee;
              breakdown.push({ label: 'Tambah Paket Setengah Hari', amount: rates.halfDayRate });
              if (remainingHours > 12) {
                  breakdown.push({ label: `Denda ${remainingHours - 12} Jam`, amount: (remainingHours - 12) * rates.hourlyRate });
              }
          } else { // 16-23 jam
              const scenarioA = rates.halfDayRate + ((remainingHours - 12) * rates.hourlyRate);
              const fee = Math.min(scenarioA, rates.fullDayRate);
              lateFee += fee;
              if (fee === rates.fullDayRate) {
                  breakdown.push({ label: 'Pembulatan Paket 1 Hari', amount: fee });
              } else {
                  // Skenario ini seharusnya tidak terjadi dengan aturan harga sekarang, tapi sebagai cadangan
                  breakdown.push({ label: 'Tambah Paket Setengah Hari', amount: rates.halfDayRate });
                  if (remainingHours > 12) {
                      breakdown.push({ label: `Denda ${remainingHours - 12} Jam`, amount: (remainingHours - 12) * rates.hourlyRate });
                  }
              }
          }
      }

      return { total: lateFee, breakdown };
  };

  export default function CheckOutPage() {
    const router = useRouter();
    const params = useParams();
    const bookingId = params.bookingId as string;

    const [booking, setBooking] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // State untuk perpanjangan durasi
    const [extensionType, setExtensionType] = useState<'FULL_DAY' | 'HALF_DAY'>('FULL_DAY');
    const [extensionDuration, setExtensionDuration] = useState(1);
    
    // State untuk fitur sanksi
    const [chargeableItems, setChargeableItems] = useState<ChargeableItem[]>([]);
    const [selectedChargeId, setSelectedChargeId] = useState<string>('');
    const [addedCharges, setAddedCharges] = useState<AddedCharge[]>([]);

    // State untuk pembayaran
    const [paymentMethod, setPaymentMethod] = useState<string | undefined>();
    const [paymentStatus, setPaymentStatus] = useState<string | undefined>();

    useEffect(() => {
      if (bookingId) {
        const fetchData = async () => {
          setIsLoading(true);
          // Ambil detail booking dan daftar item sanksi secara bersamaan
          const [bookingRes, itemsRes] = await Promise.all([
            fetch(`/api/bookings/${bookingId}`),
            fetch('/api/chargeable-items')
          ]);

          if (bookingRes.ok) {
            const bookingData = await bookingRes.json();
            setBooking(bookingData);
            setPaymentMethod(bookingData.paymentMethod);
            setPaymentStatus(bookingData.paymentStatus);
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
    setIsLoading(true); // <-- Tombol dinonaktifkan
    try {
      const res = await fetch(`/api/bookings/${bookingId}/extend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extensionType, duration: extensionDuration }),
      });
      if (res.ok) {
          const updatedBooking = await res.json();
          setBooking(updatedBooking);
      } else {
          alert('Gagal memperpanjang durasi.');
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan.');
    } finally {
      setIsLoading(false); // <-- Tombol diaktifkan kembali, APAPUN YANG TERJADI
    }
  };
    const handleAddCharge = () => {
    const selectedItem = chargeableItems.find(item => item.id === selectedChargeId);
    if (selectedItem) {
      setAddedCharges(prev => [
        ...prev,
        {
          chargeableItemId: selectedItem.id,
          quantity: 1, // Untuk saat ini kuantitas selalu 1
          itemName: selectedItem.itemName,
          itemPrice: selectedItem.chargeAmount,
        }
      ]);
      setSelectedChargeId(''); // Reset dropdown setelah item ditambahkan
    }
  };

    const handleCheckout = async () => {
    setIsLoading(true);
    try {
      await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          charges: addedCharges.map(({ chargeableItemId, quantity }) => ({ chargeableItemId, quantity })),
          paymentMethod,
          paymentStatus,
        }),
      });
      router.push('/admin');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Gagal melakukan check-out.');
      setIsLoading(false); // Pastikan loading berhenti jika error
    }
  };
  
  if (isLoading || !booking) {
    return <p className="p-8">Memuat detail booking...</p>;
  }

    // --- LOGIKA UTAMA ADA DI SINI ---
    // Tentukan apakah properti ini gratis setelah data booking tersedia
    const isFreeProperty = booking.room?.property?.isFree;

    // Kalkulasi biaya hanya jika properti tidak gratis
    const lateFeeDetails = !isFreeProperty ? calculateLateFeeDetails(booking) : { total: 0, breakdown: [] };
    const chargesFee = addedCharges.reduce((total, charge) => total + charge.itemPrice * charge.quantity, 0);
    const currentTotal = isFreeProperty ? 0 : (booking.baseFee + lateFeeDetails.total + chargesFee);

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
            
            {!isFreeProperty && (
              <>
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
            
            <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Status Pembayaran</h3>
          {booking.paymentStatus === 'PAID' ? (
              <p className="text-green-600 font-medium">Sudah Lunas ({booking.paymentMethod})</p>
          ) : (
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <Label>Metode Pembayaran</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="CASH">Cash</SelectItem>
                              <SelectItem value="TRANSFER">Transfer</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div>
                      <Label>Status</Label>
                      <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                          <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="PAID">Lunas</SelectItem>
                              <SelectItem value="UNPAID">Belum Lunas</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>
          )}
        </div>

            <div className="mt-4 p-4 bg-secondary rounded-lg space-y-2">
              <h3 className="font-semibold mb-2">Rincian Biaya</h3>
              <div className="flex justify-between text-sm">
                <span>Tarif Dasar:</span> 
                <span>Rp {booking.baseFee.toLocaleString('id-ID')}</span>
              </div>

              {lateFeeDetails.breakdown.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm text-destructive">
                      <span>{item.label}:</span>
                      <span>Rp {item.amount.toLocaleString('id-ID')}</span>
                  </div>
              ))}

              {addedCharges.map((charge, index) => (
                <div key={index} className="flex justify-between text-sm text-destructive">
                  <span>Sanksi ({charge.itemName}):</span>
                  <span>Rp {charge.itemPrice.toLocaleString('id-ID')}</span>
                </div>
              ))}

              <div className="flex justify-between font-bold text-lg mt-2 border-t pt-2">
                <span>Total Tagihan:</span> 
                <span>Rp {currentTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>
            </>
            )}
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