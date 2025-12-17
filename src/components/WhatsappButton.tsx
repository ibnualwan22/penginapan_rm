'use client';

import { Button } from "@/components/ui/button";
import { MessageCircle } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

interface WhatsappButtonProps {
  guestName: string;
  guestPhone: string;
  expectedCheckOut: string | Date;
}

export default function WhatsappButton({ guestName, guestPhone, expectedCheckOut }: WhatsappButtonProps) {
  const handleSendWA = () => {
    if (!guestPhone) return alert("Nomor HP tamu tidak tersedia");

    // Format Nomor HP (08xx -> 628xx)
    let phone = guestPhone.trim();
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);
    if (phone.startsWith('+')) phone = phone.slice(1);

    const now = new Date();
    const checkOutDate = new Date(expectedCheckOut);
    
    // Hitung selisih dalam menit
    const diffInMinutes = differenceInMinutes(checkOutDate, now);

    let timeStatus = "";

    // LOGIKA HITUNGAN WAKTU
    if (diffInMinutes < 0) {
        // --- KASUS TELAT (Waktu Minus) ---
        const lateMinutes = Math.abs(diffInMinutes);
        const days = Math.floor(lateMinutes / (24 * 60));
        const hours = Math.floor((lateMinutes % (24 * 60)) / 60);
        
        // Buat string detail (misal: 1 Hari 2 Jam)
        let lateStr = "";
        if (days > 0) lateStr += `${days} Hari `;
        if (hours > 0) lateStr += `${hours} Jam`;
        if (lateStr === "") lateStr = "kurang dari 1 Jam";

        timeStatus = `⚠️ *PERHATIAN:* Waktu check-out Anda sudah terlewat selama *${lateStr}*. Mohon segera lakukan konfirmasi perpanjangan atau check-out untuk menghindari denda bertingkat.`;
    } else {
        // --- KASUS BELUM TELAT (Sisa Waktu) ---
        const days = Math.floor(diffInMinutes / (24 * 60));
        const hours = Math.floor((diffInMinutes % (24 * 60)) / 60);

        let sisaStr = "";
        if (days > 0) sisaStr += `${days} Hari `;
        if (hours > 0) sisaStr += `${hours} Jam`;
        if (days === 0 && hours === 0) sisaStr = "kurang dari 1 Jam";

        timeStatus = `⏳ Sisa waktu menginap Anda tinggal: *${sisaStr}*.`;
    }

    // Template Pesan WhatsApp
    const message = [
        `Assalamu'alaikum Warahmatullahi Wabarakatuh,`,
        `Yth. Bapak/Ibu *${guestName}*,`,
        '',
        `Kami dari manajemen penginapan ingin mengingatkan jadwal check-out Anda:`,
        `📅 *${format(checkOutDate, 'EEEE, dd MMMM yyyy', { locale: localeID })}*`,
        `⏰ Pukul: *${format(checkOutDate, 'HH:mm', { locale: localeID })} WIB*`,
        '',
        timeStatus,
        '',
        'Jika Anda berencana memperpanjang masa inap, mohon informasikan kepada kami sebelum waktu habis.',
        '',
        'Terima kasih dan selamat beristirahat.',
        '🙏'
    ].join('\n'); // Gabungkan baris dengan enter

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <Button 
      size="sm" 
      variant="outline" 
      className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700" 
      onClick={handleSendWA}
      title="Kirim Pengingat WA"
    >
      <MessageCircle className="h-4 w-4 mr-1" />
      Ingatkan
    </Button>
  );
}