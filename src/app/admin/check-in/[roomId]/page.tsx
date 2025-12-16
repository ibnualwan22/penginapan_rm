'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AsyncSelect from 'react-select/async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2, Calculator, User, CreditCard, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

type SelectOption = { value: string; label: string; details?: any };

export default function CheckInPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<any>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);

  // Form State
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  
  const [includeStudent, setIncludeStudent] = useState(false);
  const [selectedSantri, setSelectedSantri] = useState<SelectOption | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<SelectOption | null>(null);
  
  const [bookingType, setBookingType] = useState<'FULL_DAY' | 'HALF_DAY'>('FULL_DAY');
  const [duration, setDuration] = useState<number>(1);
  const [isExtraHalfDay, setIsExtraHalfDay] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [amountPaid, setAmountPaid] = useState<string>(''); 

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch Data Kamar
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        if (!res.ok) throw new Error('Gagal mengambil data kamar');
        const data = await res.json();
        setRoom(data);
        if (data.property.isFree) setPaymentMethod('-'); 
      } catch (err) {
        setError('Kamar tidak ditemukan');
      } finally {
        setLoadingRoom(false);
      }
    };
    fetchRoom();
  }, [roomId]);

  // 2. Kalkulator Real-time
  const calculateTotal = () => {
    if (!room || room.property.isFree || !room.roomType) return 0; // Kalau roomType null, return 0 (cegah NaN)

    let total = 0;
    if (bookingType === 'FULL_DAY') {
      total = (room.roomType.priceFullDay || 0) * duration;
      if (isExtraHalfDay) {
        total += (room.roomType.priceHalfDay || 0);
      }
    } else {
      total = (room.roomType.priceHalfDay || 0);
    }
    return total;
  };

  const totalEstimate = calculateTotal();
  const numericAmountPaid = parseFloat(amountPaid) || 0;
  const balance = totalEstimate - numericAmountPaid;

  // 3. Logic WA Helper
  const sendWhatsAppNotification = (bookingData: any) => {
    if (!guestPhone) return;
    
    // Format nomor HP (08xx -> 628xx)
    let phone = guestPhone.trim();
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1);
    }

    // Format Tanggal
    const checkInDate = new Date(bookingData.checkIn);
    const checkOutDate = new Date(bookingData.expectedCheckOut);
    
    // Logic Info Pembayaran
    let paymentInfo = '';
    const isFreeProperty = room.property.isFree;
    
    if (isFreeProperty) {
        paymentInfo = '💰 Biaya: GRATIS (Fasilitas)';
    } else {
        const total = bookingData.totalFee;
        const paid = bookingData.amountPaid || 0;
        const remaining = total - paid;

        if (remaining <= 0) {
            paymentInfo = `💰 Total Tagihan: Rp ${total.toLocaleString('id-ID')} (LUNAS)`;
        } else {
            paymentInfo = [
                `💰 Total Tagihan: Rp ${total.toLocaleString('id-ID')}`,
                `💸 Bayar Awal (DP): Rp ${paid.toLocaleString('id-ID')}`,
                `⚠️ Sisa Kekurangan: Rp ${remaining.toLocaleString('id-ID')}`
            ].join('\n');
        }
    }

    // Ambil nama santri (jika ada)
    const santriDisplay = includeStudent && selectedSantri ? selectedSantri.label : '-';

    // Susun Pesan Sesuai Template Baru
    const message = [
        '📩 *Pesan Selamat Datang (Check-In)*',
        'Selamat Datang di Penginapan Roudlatul Muta’alimin',
        `Yth. Bapak/Ibu *${guestName}*,`,
        '',
        'Terima kasih telah melakukan proses check-in. Dengan senang hati kami sampaikan detail informasi menginap Anda:',
        `👤 Santri: ${santriDisplay}`,
        `🛏️ Kamar: ${room.roomNumber} (${room.property.name})`,
        `🕑 Check-in: ${format(checkInDate, 'dd MMM yyyy, HH:mm', { locale: localeID })}`,
        `📅 Jadwal Check-out: ${format(checkOutDate, 'dd MMM yyyy, HH:mm', { locale: localeID })}`,
        `📦 Paket: ${isFreeProperty ? 'Fasilitas (Gratis)' : (bookingType === 'FULL_DAY' ? `Harian (${duration} hari${isExtraHalfDay ? ' + Setengah Hari' : ''})` : 'Setengah Hari')}`,
        paymentInfo,
        '',
        'Apabila Bapak/Ibu memerlukan bantuan, jangan sungkan untuk menghubungi kontak layanan kami:',
        '',
        '☕ Cafe Arwana: 6288215278401',
        '🏨 Resepsionis Hotel RM: 6285842817105',
        '🚗 Mobil Pelayanan Tamu: 62882007534377 / 6282323745184',
        '',
        '🙏 Semoga masa tinggal Bapak/Ibu bersama kami memberikan kenyamanan dan pengalaman yang berkesan.'
    ].join('\n');

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };
  
  // 4. Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        roomId,
        guestName,
        guestPhone,
        studentName: includeStudent ? selectedSantri?.label : '-', 
        addressId: selectedAddress?.value,
        addressLabel: selectedAddress?.label,
        bookingType,
        duration: bookingType === 'FULL_DAY' ? duration : 0,
        isExtraHalfDay: bookingType === 'FULL_DAY' ? isExtraHalfDay : false,
        amountPaid: numericAmountPaid,
        paymentMethod: room?.property?.isFree ? null : paymentMethod,
      };

      const res = await fetch('/api/bookings/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg);
      }

      const responseData = await res.json();

      // [FIX 3] Kirim WA jika ada nomor HP
      if (guestPhone) {
        sendWhatsAppNotification(responseData);
      }

      router.push('/admin'); 
      router.refresh();
      
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
      setIsSubmitting(false);
    }
  };

  // [FIX 2] Gunakan parameter 'search' agar cocok dengan API route3.ts
  const loadSantri = async (inputValue: string) => {
    if (inputValue.length < 3) return [];
    try {
        // PERUBAHAN DI SINI: ganti ?name= jadi ?search=
        const res = await fetch(`/api/students?search=${inputValue}`); 
        const data = await res.json();
        
        // Cek struktur data API santri Anda. 
        // Asumsi data array langsung, atau data.data
        const list = Array.isArray(data) ? data : (data.data || []);
        
        return list.map((item: any) => ({
            value: item.id || item.regency  || item.activeDormitory, 
            label: `${item.name} (${item.activeDormitory || '-'}. ${item.regency || '-'}, )`,
            details: item
        }));
    } catch (e) { return []; }
  };

  const loadRegencies = async (inputValue: string) => {
    if (inputValue.length < 3) return [];
    try {
        // Fetch ke endpoint proxy Anda (yang memanggil API Amtsilati)
        const res = await fetch(`/api/regencies?name=${inputValue}`);
        const data = await res.json();
        
        // Pastikan mengambil dari array 'results' sesuai format JSON yang Anda kirim
        if (data && data.results && Array.isArray(data.results)) {
            return data.results.map((item: any) => ({
                value: String(item.id),     // Konversi ID ke string agar aman
                label: item.label,          // [FIX] Gunakan 'label' (Contoh: Kab. Tegal)
            }));
        }
        return [];
    } catch (e) { 
        console.error("Gagal load kota:", e);
        return []; 
    }
  };

  if (loadingRoom) return <div className="p-8 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto"/> Memuat data kamar...</div>;
  if (!room) return <div className="p-8 text-center text-red-500">Data kamar tidak ditemukan.</div>;

  const isFree = room.property.isFree;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <Card className="shadow-lg border-t-4 border-t-primary">
        <CardHeader className="bg-gray-50/50 pb-4">
          <CardTitle className="text-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span>Check-In: Kamar {room.roomNumber}</span>
                <span className="text-xs font-normal px-2 py-1 bg-white border rounded text-gray-500">
                {room.property.name}
                </span>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* DATA TAMU */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-gray-700">
                <User size={18} /> Data Tamu
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nama Wali / Tamu <span className="text-red-500">*</span></Label>
                  <Input 
                    value={guestName} 
                    onChange={e => setGuestName(e.target.value)} 
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>
                <div>
                  <Label>Nomor HP (WhatsApp)</Label>
                  <Input 
                    value={guestPhone} 
                    onChange={e => setGuestPhone(e.target.value)} 
                    placeholder="Contoh: 08123456789"
                    type="tel"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Digunakan untuk mengirim notifikasi check-in</p>
                </div>
              </div>

              <div>
                <Label>Kota Asal / Alamat</Label>
                <AsyncSelect
                  cacheOptions defaultOptions
                  loadOptions={loadRegencies}
                  onChange={(val) => setSelectedAddress(val as SelectOption)}
                  placeholder="Ketik nama kota/kabupaten..."
                  className="text-sm"
                />
              </div>

              <div className="flex items-center space-x-2 border p-3 rounded-md bg-gray-50">
                <Checkbox 
                  id="includeStudent" 
                  checked={includeStudent}
                  onCheckedChange={(checked) => setIncludeStudent(checked as boolean)}
                />
                <Label htmlFor="includeStudent" className="cursor-pointer font-normal">
                  Sertakan Data Santri yang dikunjungi?
                </Label>
              </div>

              {includeStudent && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label>Cari Nama Santri</Label>
                  <AsyncSelect
                    cacheOptions defaultOptions={false}
                    loadOptions={loadSantri}
                    onChange={(val) => setSelectedSantri(val as SelectOption)}
                    placeholder="Ketik minimal 3 huruf..."
                    className="text-sm"
                    noOptionsMessage={() => "Ketik nama santri..."}
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* BIAYA & PAKET */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-gray-700">
                <Calculator size={18} /> Paket & Biaya
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tipe Booking</Label>
                  <Select 
                    value={bookingType} 
                    onValueChange={(v: any) => { setBookingType(v); setIsExtraHalfDay(false); }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_DAY">Harian (Full Day)</SelectItem>
                      <SelectItem value="HALF_DAY">Setengah Hari (Half Day)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {bookingType === 'FULL_DAY' && (
                  <div>
                    <Label>Durasi (Malam/Hari)</Label>
                    <Input 
                      type="number" 
                      min={1} 
                      value={duration} 
                      onChange={e => setDuration(parseInt(e.target.value) || 1)}
                    />
                  </div>
                )}
              </div>

              {bookingType === 'FULL_DAY' && !isFree && (
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox 
                    id="extraHalf" 
                    checked={isExtraHalfDay}
                    onCheckedChange={(c) => setIsExtraHalfDay(c as boolean)}
                  />
                  <Label htmlFor="extraHalf" className="cursor-pointer">
                    Tambah Setengah Hari? (+ Rp {room.roomType?.priceHalfDay?.toLocaleString() || 0})
                  </Label>
                </div>
              )}

              {/* Rincian Biaya */}
              {!isFree && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-2 mt-4">
                  <div className="flex justify-between text-sm">
                    <span>Harga Dasar ({bookingType === 'FULL_DAY' ? 'Harian' : 'Setengah Hari'}):</span>
                    <span>Rp {bookingType === 'FULL_DAY' 
                        ? (room.roomType?.priceFullDay?.toLocaleString() || '0') 
                        : (room.roomType?.priceHalfDay?.toLocaleString() || '0')}
                    </span>
                  </div>
                  
                  {bookingType === 'FULL_DAY' && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>x {duration} Hari</span>
                      <span>Rp {((room.roomType?.priceFullDay || 0) * duration).toLocaleString()}</span>
                    </div>
                  )}

                  {isExtraHalfDay && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>+ Extra Setengah Hari</span>
                      <span>Rp {(room.roomType?.priceHalfDay || 0).toLocaleString()}</span>
                    </div>
                  )}
                  
                  <Separator className="bg-blue-200"/>
                  <div className="flex justify-between font-bold text-lg text-blue-900">
                    <span>Total Tagihan:</span>
                    <span>Rp {totalEstimate.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* PEMBAYARAN */}
            {!isFree && (
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-gray-700">
                  <CreditCard size={18} /> Pembayaran
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Metode Pembayaran</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Tunai (Cash)</SelectItem>
                        <SelectItem value="TRANSFER">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Bayar Sekarang (DP)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500 text-sm">Rp</span>
                      <Input 
                        type="number"
                        placeholder="0"
                        className="pl-10"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                      />
                    </div>
                    <p className={`text-xs mt-1 font-medium ${balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {balance > 0 
                        ? `Kurang Bayar: Rp ${balance.toLocaleString('id-ID')}` 
                        : balance < 0 
                          ? `Kembalian: Rp ${Math.abs(balance).toLocaleString('id-ID')}`
                          : 'LUNAS'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
              {isSubmitting ? (
                <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses... </>
              ) : (
                <span className="flex items-center">
                    Check In & Kirim WhatsApp <MessageCircle className="ml-2 h-4 w-4"/>
                </span>
              )}
            </Button>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}