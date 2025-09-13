'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AsyncSelect from 'react-select/async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

type SelectOption = {
  value: string;
  label: string;
  details?: any;
};

export default function CheckInPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  // State untuk data form
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [selectedSantri, setSelectedSantri] = useState<SelectOption | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<SelectOption | null>(null);
  const [bookingType, setBookingType] = useState<'FULL_DAY' | 'HALF_DAY'>('FULL_DAY');
  const [duration, setDuration] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>();
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>();
  
  // State tambahan
  const [room, setRoom] = useState<any>(null); // State untuk menyimpan detail kamar lengkap
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ambil data kamar, termasuk info propertinya, saat halaman dimuat
  useEffect(() => {
    if (roomId) {
      const fetchRoomData = async () => {
        setIsLoading(true);
        // Kita gunakan API yang mengambil detail kamar lengkap
        const res = await fetch(`/api/rooms/${roomId}`); 
        if (res.ok) {
          const data = await res.json();
          setRoom(data);
        }
        setIsLoading(false);
      };
      fetchRoomData();
    }
  }, [roomId]);

  const loadSantriOptions = async (inputValue: string) => {
    if (inputValue.length < 3) return [];
    const res = await fetch(`/api/students?search=${inputValue}`);
    const { data } = await res.json();
    return data.map((santri: any) => ({
      value: santri.name,
      label: `${santri.name} (${santri.regency || 'Alamat tidak diketahui'})`,
      details: santri,
    }));
  };

  const loadAddressOptions = async (inputValue: string) => {
    if (inputValue.length < 3) return [];
    const res = await fetch(`/api/regencies?name=${inputValue}`);
    const { results } = await res.json();
    return results.map((addr: any) => ({
      value: addr.id.toString(),
      label: addr.label,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri || !selectedAddress) {
      setError('Nama Santri dan Alamat wajib diisi.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // Dapatkan status gratis dari state 'room'
      const isFreeProperty = room?.property?.isFree;
      
      const payload = {
        roomId,
        guestName,
        guestPhone,
        studentName: selectedSantri.value,
        addressId: selectedAddress.value,
        addressLabel: selectedAddress.label,
        bookingType: isFreeProperty ? 'FULL_DAY' : bookingType,
        duration: isFreeProperty ? 1 : (bookingType === 'FULL_DAY' ? duration : 0),
        paymentMethod: isFreeProperty ? null : paymentMethod,
        paymentStatus: isFreeProperty ? 'UNPAID' : paymentStatus,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || 'Gagal melakukan check-in');
      }

      const newBooking = await res.json();
      if (guestPhone && room?.roomNumber) { // Pastikan roomNumber ada
        const formattedPhone = guestPhone.startsWith('62') ? guestPhone : `62${guestPhone.substring(1)}`;
        
        let paymentInfo = '';
        if (!isFreeProperty) {
            const paymentStatusText = payload.paymentStatus === 'PAID' ? 'Lunas' : 'Belum Lunas';
            const paymentMethodText = payload.paymentMethod ? `\n💰 Metode: ${payload.paymentMethod}` : '';
            paymentInfo = `💳 Status Pembayaran: ${paymentStatusText}${paymentMethodText}\n💵 Total Biaya: Rp ${newBooking.totalFee.toLocaleString('id-ID')}`;
        } else {
            paymentInfo = '💳 Status Pembayaran: Gratis (Tidak ada biaya)';
        }

        const message = [
            '📩 Pesan Selamat Datang (Check-In)',
            'Selamat Datang di Penginapan Roudlatul Muta’alimin',
            `Yth. Bapak/Ibu ${guestName},`,
            '',
            'Terima kasih telah melakukan proses check-in. Dengan senang hati kami sampaikan detail informasi menginap Anda:',
            `👤 Santri: ${selectedSantri.value}`,
            `🛏️ Kamar: ${room.roomNumber}`,
            `🕑 Check-in: ${format(new Date(newBooking.checkIn), 'dd MMM yyyy, HH:mm', { locale: localeID })}`,
            `📅 Jadwal Check-out: ${format(new Date(newBooking.expectedCheckOut), 'dd MMM yyyy, HH:mm', { locale: localeID })}`,
            `📦 Paket: ${isFreeProperty ? 'Fasilitas (Gratis)' : (payload.bookingType === 'FULL_DAY' ? `Harian (${payload.duration} hari)` : 'Setengah Hari')}`,
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

        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }

      router.push('/admin');
      router.refresh();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isFreeProperty = room?.property?.isFree;

  // Tampilkan pesan loading jika data kamar belum siap
  if (isLoading || !room) {
    return <p className="p-8">Memuat data kamar...</p>;
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Formulir Check-in (Kamar {room.roomNumber})</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="guestName">Nama Wali Santri</Label>
                <Input type="text" id="guestName" value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
            </div>

            <div className="space-y-2">
                <Label htmlFor="guestPhone">Nomor HP Wali</Label>
                <Input type="tel" id="guestPhone" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="Contoh: 08123456789" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="studentName">Cari Nama Santri</Label>
                <AsyncSelect instanceId="student-select" cacheOptions defaultOptions loadOptions={loadSantriOptions} onChange={setSelectedSantri} placeholder="Ketik min. 3 huruf..." isClearable />
                {selectedSantri && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm text-muted-foreground"><p><b>Asrama:</b> {selectedSantri.details.activeDormitory}</p><p><b>Jenis Kelamin:</b> {selectedSantri.details.gender}</p></div>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="address">Cari Alamat (Kabupaten)</Label>
                <AsyncSelect instanceId="address-select" cacheOptions defaultOptions loadOptions={loadAddressOptions} onChange={setSelectedAddress} placeholder="Ketik min. 3 huruf..." isClearable />
            </div>
            
            {/* --- TAMPILKAN BAGIAN BIAYA HANYA JIKA PROPERTI TIDAK GRATIS --- */}
            {!isFreeProperty && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bookingType">Paket Menginap</Label>
                  <Select value={bookingType} onValueChange={(v) => setBookingType(v as 'FULL_DAY' | 'HALF_DAY')}>
                      <SelectTrigger><SelectValue placeholder="Pilih paket" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="FULL_DAY">Satu Hari</SelectItem>
                          <SelectItem value="HALF_DAY">Setengah Hari</SelectItem>
                      </SelectContent>
                  </Select>
                </div>

                {bookingType === 'FULL_DAY' && (
                    <div className="space-y-2">
                        <Label htmlFor="duration">Lama Durasi (hari)</Label>
                        <Input type="number" id="duration" value={Number.isFinite(duration) ? duration : 1} onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value || '1', 10)))} min="1" required />
                    </div>
                )}
                
                <div className="border-t pt-4 space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">Catat Pembayaran Awal (Opsional)</h3>
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
                </div>
              </>
            )}

            {error && <p className="text-destructive text-sm">{error}</p>}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Memproses...' : 'Submit Check-in & Kirim Notifikasi'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}