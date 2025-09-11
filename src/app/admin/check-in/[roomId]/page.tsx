'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AsyncSelect from 'react-select/async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SelectOption = {
  value: string;
  label: string;
  details?: any;
};

export default function CheckInPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [selectedSantri, setSelectedSantri] = useState<SelectOption | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<SelectOption | null>(null);

  // 👉 ketatkan tipe & jadikan controlled
  const [bookingType, setBookingType] = useState<'FULL_DAY' | 'HALF_DAY'>('FULL_DAY');
  const [duration, setDuration] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>();
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSantriOptions = async (inputValue: string) => {
    if (inputValue.length < 3) return [];
    const res = await fetch(`/api/students?search=${inputValue}`);
    const { data } = await res.json();
    return data.map((santri: any) => ({
      value: santri.name,
      label: `${santri.name} (${santri.regency})`,
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
      // Debug lokal (opsional):
      // console.log({ bookingType, duration });

      const payload = {
        roomId,
        guestName,
        guestPhone,
        studentName: selectedSantri.value,
        addressId: selectedAddress.value,
        addressLabel: selectedAddress.label, // Simpan nama alamat
        bookingType,                                      // 'FULL_DAY' | 'HALF_DAY'
        duration: bookingType === 'FULL_DAY' ? duration : 0, // HALF_DAY => 0
        paymentMethod,
        paymentStatus,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Gagal melakukan check-in');
      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Formulir Check-in</CardTitle>
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
            
            <div className="space-y-2">
              <Label htmlFor="bookingType">Paket Menginap</Label>
              {/* 👉 jadikan controlled: pakai value, bukan defaultValue */}
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
                <Input
                  type="number"
                  id="duration"
                  value={Number.isFinite(duration) ? duration : 1}
                  onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value || '1', 10)))}
                  min="1"
                  required
                />
              </div>
            )}
            <div className="border-t pt-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Catat Pembayaran Awal (Opsional)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Metode Pembayaran</Label>
            <Select onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select onValueChange={setPaymentStatus}>
              <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PAID">Lunas</SelectItem>
                <SelectItem value="UNPAID">Belum Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Memproses...' : 'Submit Check-in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}