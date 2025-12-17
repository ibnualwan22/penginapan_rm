'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, UploadCloud, Image as ImageIcon } from 'lucide-react';
import Script from 'next/script';

type RoomImage = {
  id: string;
  url: string;
  publicId?: string | null;
};

export default function RoomImageManager({ roomId, initialImages }: { roomId: string, initialImages: RoomImage[] }) {
  const [images, setImages] = useState<RoomImage[]>(initialImages);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // 1. Gunakan useRef untuk menyimpan instance widget agar tidak hilang saat re-render
  const cloudinaryWidgetRef = useRef<any>(null);

  // 2. Fungsi untuk inisialisasi widget
  const initializeWidget = () => {
    // @ts-ignore
    if (window && window.cloudinary && !cloudinaryWidgetRef.current) {
        // @ts-ignore
        cloudinaryWidgetRef.current = window.cloudinary.createUploadWidget({
            cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
            uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
            sources: ['local', 'camera'],
            multiple: true,
            folder: 'asrama_takhossus',
            // PENTING: Tambahkan zIndex tinggi agar muncul di atas sidebar admin
            styles: {
                palette: {
                    window: "#FFFFFF",
                    sourceBg: "#F4F4F5",
                    windowBorder: "#90A0B3",
                    tabIcon: "#0078FF",
                    inactiveTabIcon: "#0E2F5A",
                    menuIcons: "#5A616A",
                    link: "#0078FF",
                    action: "#339933",
                    inProgress: "#0078FF",
                    complete: "#339933",
                    error: "#cc0000",
                    textDark: "#000000",
                    textLight: "#FFFFFF"
                },
                fonts: {
                    default: null,
                    "'Inter', sans-serif": {
                        url: "https://fonts.googleapis.com/css?family=Inter",
                        active: true
                    }
                }
            },
            zIndex: 99999 // Paksa layer paling atas
        }, 
        (error: any, result: any) => {
            if (!error && result && result.event === "success") {
                handleUploadSuccess(result);
            }
        });
    }
  };

  const handleUploadSuccess = async (result: any) => {
    const { secure_url, public_id } = result.info;

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
            setImages(prev => [...prev, newImg]); 
        }
    } catch (error) {
        console.error("Gagal save db:", error);
    }
  };

  const handleDelete = async (imageId: string, publicId?: string | null) => {
    if(!confirm("Hapus foto ini?")) return;
    setIsDeleting(imageId);

    try {
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

  // 3. Tombol Handler: Cukup panggil .open()
  const handleOpenWidget = () => {
    if (cloudinaryWidgetRef.current) {
        cloudinaryWidgetRef.current.open();
    } else {
        // Fallback jika ref belum siap (misal internet lambat load script)
        initializeWidget();
        if (cloudinaryWidgetRef.current) {
            cloudinaryWidgetRef.current.open();
        } else {
            alert("Widget belum siap, silakan tunggu sejenak dan coba lagi.");
        }
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Load Script dengan strategi lazyOnload agar tidak memblokir UI */}
      <Script 
        src="https://upload-widget.cloudinary.com/global/all.js" 
        onLoad={initializeWidget} // Inisialisasi otomatis setelah script selesai dimuat
        strategy="lazyOnload"
      />

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
            <ImageIcon className="w-5 h-5"/> Galeri Kamar
        </h3>
        
        <Button 
            type="button" 
            onClick={handleOpenWidget}
            className="bg-blue-600 hover:bg-blue-700"
        >
            <UploadCloud className="w-4 h-4 mr-2"/> Upload Foto Baru
        </Button>
      </div>

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