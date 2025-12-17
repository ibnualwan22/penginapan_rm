'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, UploadCloud, Image as ImageIcon, Plus } from 'lucide-react';

type RoomImage = {
  id: string;
  url: string;
  publicId?: string | null;
};

export default function RoomImageManager({ roomId, initialImages }: { roomId: string, initialImages: RoomImage[] }) {
  const [images, setImages] = useState<RoomImage[]>(initialImages);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Ref untuk input file tersembunyi
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fungsi Upload ke Cloudinary (Manual via API)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert("Konfigurasi Cloudinary (Cloud Name / Preset) belum dipasang di .env!");
      setIsUploading(false);
      return;
    }

    // Loop semua file yang dipilih
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'asrama_takhossus'); // Opsional: Folder di Cloudinary

      try {
        // A. Upload langsung ke Cloudinary API
        const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData
        });
        
        if (!cloudinaryRes.ok) throw new Error('Gagal upload ke Cloudinary');
        const data = await cloudinaryRes.json();

        // B. Simpan URL hasilnya ke Database (via API Backend kita)
        const saveRes = await fetch(`/api/rooms/${roomId}/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: data.secure_url,
                publicId: data.public_id
            })
        });

        if (saveRes.ok) {
            const newImg = await saveRes.json();
            setImages(prev => [...prev, newImg]); // Update UI
        }

      } catch (error) {
        console.error("Upload Error:", error);
        alert(`Gagal mengupload foto: ${file.name}`);
      }
    }

    setIsUploading(false);
    // Reset input agar bisa pilih file yang sama lagi kalau mau
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 2. Fungsi Hapus
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
            alert("Gagal menghapus foto dari database");
        }
    } catch (error) {
        alert("Terjadi kesalahan koneksi");
    } finally {
        setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Input File Tersembunyi */}
      <input 
        type="file" 
        multiple 
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border">
        <div>
           <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
              <ImageIcon className="w-5 h-5"/> Galeri Kamar
           </h3>
           <p className="text-sm text-gray-500">
             {images.length} foto tersimpan
           </p>
        </div>
        
        {/* Tombol Trigger Input File */}
        <Button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-blue-600 hover:bg-blue-700"
        >
            {isUploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Mengupload...</>
            ) : (
              <><UploadCloud className="w-4 h-4 mr-2"/> Pilih Foto dari Galeri</>
            )}
        </Button>
      </div>

      {/* Grid Tampilan Foto */}
      {images.length === 0 ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="p-10 border-2 border-dashed rounded-xl text-center text-gray-400 hover:bg-gray-50 hover:border-blue-300 cursor-pointer transition-colors"
        >
            <UploadCloud className="w-10 h-10 mx-auto mb-2 opacity-50"/>
            <p>Belum ada foto. Klik di sini untuk upload.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* Kartu Upload Cepat di Grid */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all"
            >
               <Plus className="w-8 h-8 mb-1"/>
               <span className="text-xs font-medium">Tambah Foto</span>
            </div>

            {images.map((img) => (
                <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border shadow-sm bg-gray-100">
                    <Image 
                        src={img.url} 
                        alt="Kamar" 
                        fill 
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 20vw"
                    />
                    
                    {/* Overlay Delete */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                            variant="destructive" 
                            size="icon"
                            className="h-8 w-8"
                            disabled={isDeleting === img.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(img.id, img.publicId);
                            }}
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