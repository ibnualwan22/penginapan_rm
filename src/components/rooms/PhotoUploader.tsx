'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Room = { id: string; roomNumber: string; images?: { id: string; url: string }[] };

export default function PhotoUploader({ room }: { room: Room }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    const el = inputRef.current;
    const file = el?.files?.[0];        // ✅ guard ref & file
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await fetch(
        `/api/rooms/${room.id}/upload?filename=${encodeURIComponent(file.name)}`,
        { method: 'POST', body: file }
      );
      if (!res.ok) throw new Error(await res.text());
      if (el) el.value = '';            // reset input (ref aman karena kita cek)
      router.refresh();
    } catch (e: any) {
      alert(e.message || 'Upload gagal');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Yakin ingin menghapus foto ini?')) return;
    await fetch(`/api/images/${imageId}`, { method: 'DELETE' });
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center space-x-2 border p-4 rounded-lg">
        <Input ref={inputRef} type="file" accept="image/*" />
        <Button type="button" onClick={handleUpload} disabled={isUploading}>
          {isUploading ? 'Mengunggah…' : 'Unggah Foto'}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {(room.images ?? []).map((img) => (
          <div key={img.id} className="relative group">
            <img
              src={img.url}
              alt={`Foto Kamar ${room.roomNumber}`}
              className="rounded-md object-cover aspect-square"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="destructive" size="sm" type="button" onClick={() => handleDelete(img.id)}>
                Hapus
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
