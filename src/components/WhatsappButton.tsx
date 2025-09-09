'use client';

import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { MessageCircle } from 'lucide-react';

type Props = {
  guestName: string;
  guestPhone?: string | null;
  expectedCheckOut: Date;
};

export default function WhatsappButton({ guestName, guestPhone, expectedCheckOut }: Props) {
  if (!guestPhone) {
    return <Button variant="outline" size="sm" disabled>No. HP tidak ada</Button>;
  }

  // Pastikan nomor HP dalam format internasional tanpa '+' atau '0' di depan
  const formattedPhone = guestPhone.startsWith('62') ? guestPhone : `62${guestPhone.substring(1)}`;

  // Hitung sisa durasi
  const sisaDurasi = formatDistanceToNow(new Date(expectedCheckOut), {
    addSuffix: true,
    locale: localeID,
  });

  // Buat pesan
  const message = `Yth. Bapak/Ibu ${guestName}, kami informasikan bahwa sisa durasi menginap Anda di Penginapan Roudlatul Muta’alimin adalah sekitar ${sisaDurasi}. Terima kasih.`;

  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

  return (
    <Button asChild variant="secondary" size="sm">
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="h-4 w-4 mr-2" />
        Kirim Pengingat
      </a>
    </Button>
  );
}