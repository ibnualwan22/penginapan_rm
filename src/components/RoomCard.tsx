'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns'; // <-- 1. Import 'format'

// --- Perbarui tipe data di sini ---
type Room = {
  id: string;
  roomNumber: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  bookings: {
    id: string;
    guestName: string;
    studentName: string;
    expectedCheckOut: Date; // Tipe datanya adalah Date
  }[];
};

export default function RoomCard({ room }: { room: Room }) {
  const router = useRouter();
  
  const cardColor = {
    AVAILABLE: 'bg-green-100 hover:bg-green-200 cursor-pointer',
    OCCUPIED: 'bg-red-100 hover:bg-red-200 cursor-pointer',
    MAINTENANCE: 'bg-yellow-100 cursor-not-allowed',
  };
  
  const handleClick = () => {
    // ... (Logika handleClick tetap sama)
    if (room.status === 'AVAILABLE') {
      router.push(`/admin/check-in/${room.id}`);
    } else if (room.status === 'OCCUPIED' && room.bookings.length > 0) {
      const activeBookingId = room.bookings[0].id;
      router.push(`/admin/check-out/${activeBookingId}`);
    }
  };

  return (
    <div onClick={handleClick} className={`p-4 rounded-lg shadow-md flex flex-col justify-between min-h-[100px] ${cardColor[room.status]}`}>
      <div>
        <h3 className="font-bold text-lg">{room.roomNumber}</h3>
        <p className="text-sm capitalize">{room.status.toLowerCase()}</p>
      </div>
      
      {/* --- Tambahkan logika tampilan di sini --- */}
      {room.status === 'OCCUPIED' && room.bookings.length > 0 && (
        <div className="mt-2 text-xs text-gray-700">
          <p className="font-semibold truncate">{room.bookings[0].guestName}</p>
          <p className="truncate">({room.bookings[0].studentName})</p>
          <p className="text-gray-500 mt-1">
            Selesai Pada : {format(new Date(room.bookings[0].expectedCheckOut), 'dd MMM, HH:mm')}
          </p>
        </div>
      )}
    </div>
  );
}