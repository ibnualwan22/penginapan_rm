'use client';
import { useRouter } from 'next/navigation';

export default function DeleteRoomButton({ roomId }: { roomId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    // Minta konfirmasi sebelum menghapus
    if (confirm('Apakah Anda yakin ingin menghapus kamar ini?')) {
      await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
      });
      router.refresh(); // Muat ulang data di tabel
    }
  };

  return (
    <button onClick={handleDelete} className="text-red-600 hover:text-red-900">
      Hapus
    </button>
  );
}