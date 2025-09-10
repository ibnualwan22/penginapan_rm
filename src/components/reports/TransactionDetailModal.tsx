'use client';

import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { MessageCircle } from "lucide-react";

export default function TransactionDetailModal({ transaction }: { transaction: any }) {
    if (!transaction) return null;

    // Fungsi untuk membuat dan mengirim pesan WhatsApp
    const handleSendWhatsApp = () => {
        const { guestName, guestPhone, room, checkIn, checkOut, baseFee, lateFee, totalFee } = transaction;

        if (!guestPhone) {
            alert('Nomor HP wali santri tidak tersedia.');
            return;
        }

        const formattedPhone = guestPhone.startsWith('62') ? guestPhone : `62${guestPhone.substring(1)}`;

        // Susun pesan nota
        const message = `
*Nota Penginapan Roudlatul Muta'alimin*

Terima kasih kepada Yth. Bapak/Ibu *${guestName}*.
Berikut adalah rincian tagihan menginap Anda:

*Kamar:* ${room.roomNumber}
*Check-in:* ${format(new Date(checkIn), 'dd MMM yyyy, HH:mm', { locale: localeID })}
*Check-out:* ${format(new Date(checkOut), 'dd MMM yyyy, HH:mm', { locale: localeID })}

*Rincian Biaya:*
- Tarif Dasar: Rp ${baseFee.toLocaleString('id-ID')}
- Denda Keterlambatan: Rp ${(lateFee || 0).toLocaleString('id-ID')}
------------------
*TOTAL TAGIHAN:* *Rp ${totalFee.toLocaleString('id-ID')}*

Terima kasih atas kunjungan Anda.
        `.trim().replace(/^\s+/gm, ''); // Menghapus spasi ekstra

        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Detail Transaksi</DialogTitle>
                <DialogDescription>
                    Nota untuk kamar {transaction.room.roomNumber} atas nama {transaction.guestName}.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 text-sm">
                <p><strong>Nama Wali:</strong> {transaction.guestName}</p>
                <p><strong>Nama Santri:</strong> {transaction.studentName}</p>
                <p><strong>Alamat:</strong> {transaction.addressLabel || '-'}</p>
                <p><strong>No. HP:</strong> {transaction.guestPhone || '-'}</p>
                <hr className="my-2"/>
                <p><strong>Check-in:</strong> {format(new Date(transaction.checkIn), 'dd MMM yyyy, HH:mm')} oleh {transaction.checkedInBy.name}</p>
                <p><strong>Check-out:</strong> {format(new Date(transaction.checkOut), 'dd MMM yyyy, HH:mm')} oleh {transaction.checkedOutBy?.name || 'N/A'}</p>
                <hr className="my-2"/>
                <div className="flex justify-between"><span>Tarif Dasar:</span> <span>Rp {transaction.baseFee.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span>Denda:</span> <span>Rp {(transaction.lateFee || 0).toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between font-bold text-base mt-2 border-t pt-2"><span>Total:</span> <span>Rp {transaction.totalFee.toLocaleString('id-ID')}</span></div>
            </div>
            <DialogFooter>
                <Button onClick={handleSendWhatsApp} className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Kirim Nota via WhatsApp
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}