'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { CldUploadWidget } from 'next-cloudinary'; 
// Jika Anda belum instal next-cloudinary, jalankan: npm install next-cloudinary
// ATAU gunakan script manual di bawah jika tidak ingin nambah library berat.

// --- OPSI: MENGGUNAKAN SCRIPT MANUAL (LEBIH RINGAN) ---
import Script from 'next/script';

type RoomImage = {
  id: string;
  url: string;
  publicId?: string | null;
};

export default function RoomImageManager({ roomId, initialImages }: { roomId: string, initialImages: RoomImage[] }) {
  const [images, setImages] = useState<RoomImage[]>(initialImages);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // 1. Handle Upload Sukses dari Widget
  const handleUploadSuccess = async (result: any) => {
    const { secure_url, public_id } = result.info;

    // Simpan ke Database kita via API
    try {
        const res = await fetch(`/api/rooms/${roomId}/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: secure_url,
                publicId: public_id
            })
        });

        if (res.ok) {
            const newImg = await res.json();
            setImages(prev => [...prev, newImg]); // Update UI real-time
        }
    } catch (error) {
        alert('Gagal menyimpan gambar ke database');
    }
  };

  // 2. Handle Delete Foto
  const handleDelete = async (imageId: string, publicId?: string | null) => {
    if(!confirm("Hapus foto ini?")) return;
    setIsDeleting(imageId);

    try {
        // Panggil API DELETE kita
        let url = `/api/rooms/${roomId}/images?imageId=${imageId}`;
        if(publicId) url += `&publicId=${publicId}`;

        const res = await fetch(url, { method: 'DELETE' });

        if (res.ok) {
            setImages(prev => prev.filter(img => img.id !== imageId));
        } else {
            alert("Gagal menghapus foto");
        }
    } catch (error) {
        alert("Terjadi kesalahan");
    } finally {
        setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Script Cloudinary Widget (Wajib ada) */}
      <Script 
        src="https://upload-widget.cloudinary.com/global/all.js" 
        onLoad={() => console.log('Cloudinary Widget Loaded')}
      />

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
            <ImageIcon className="w-5 h-5"/> Galeri Kamar
        </h3>
        
        {/* Tombol Upload - Membuka Widget Cloudinary */}
        <Button 
            type="button" 
            onClick={() => {
                // @ts-ignore
                if (window && window.cloudinary) {
                    // @ts-ignore
                    window.cloudinary.openUploadWidget({
                        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
                        sources: ['local', 'camera'],
                        multiple: true,
                        folder: 'asrama_takhossus' // Opsional: nama folder di cloudinary
                    }, 
                    (error: any, result: any) => {
                        if (!error && result && result.event === "success") {
                            handleUploadSuccess(result);
                        }
                    });
                } else {
                    alert("Widget belum siap, tunggu sebentar...");
                }
            }}
            className="bg-blue-600 hover:bg-blue-700"
        >
            <UploadCloud className="w-4 h-4 mr-2"/> Upload Foto Baru
        </Button>
      </div>

      {/* Grid Galeri */}
      {images.length === 0 ? (
        <div className="p-8 border-2 border-dashed rounded-lg text-center text-gray-400 bg-gray-50">
            Belum ada foto untuk kamar ini.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((img) => (
                <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border shadow-sm">
                    <Image 
                        src={img.url} 
                        alt="Kamar" 
                        fill 
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    
                    {/* Overlay Delete */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                            variant="destructive" 
                            size="icon"
                            disabled={isDeleting === img.id}
                            onClick={() => handleDelete(img.id, img.publicId)}
                        >
                            {isDeleting === img.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                        </Button>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}