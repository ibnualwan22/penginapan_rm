'use client';

import Image from 'next/image';
import { useState } from 'react';
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

// import required modules
import { Autoplay, Navigation, Pagination, EffectFade } from 'swiper/modules';
import { ImageIcon } from 'lucide-react';

type RoomImage = {
  id: string;
  url: string;
};

export default function ImageGallery({ images }: { images: RoomImage[] }) {
  // Jika tidak ada gambar, tampilkan placeholder
  if (!images || images.length === 0) {
    return (
      <div className="aspect-[4/3] bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-400">
        <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
        <p>Belum ada foto tersedia</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg">
      <Swiper
        spaceBetween={0}
        slidesPerView={1}
        effect={'fade'} // Efek transisi pudar (lebih elegan daripada geser)
        loop={true} // Agar slide berputar terus tanpa henti
        autoplay={{
          delay: 4000, // Bergeser setiap 4 detik
          disableOnInteraction: false, // Tetap autoplay meski user mengklik navigasi
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true, // Titik navigasi di bawah dinamis
        }}
        navigation={true} // Menampilkan panah kiri/kanan
        modules={[Autoplay, Navigation, Pagination, EffectFade]}
        className="mySwiper aspect-[4/3] md:aspect-[16/9]" // Rasio gambar
      >
        {images.map((img) => (
          <SwiperSlide key={img.id} className="relative bg-gray-200">
             {/* Gunakan Next/Image fill untuk mengisi container slide */}
             <Image
                src={img.url}
                alt="Foto Kamar"
                fill
                className="object-cover"
                priority={true} // Load gambar pertama lebih cepat
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              />
              {/* Overlay gradient tipis agar panah navigasi lebih terlihat */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom CSS Kecil untuk Warna Navigasi Swiper agar putih */}
      <style jsx global>{`
        .swiper-button-next,
        .swiper-button-prev {
          color: white !important;
          text-shadow: 0 1px 3px rgba(0,0,0,0.5);
          transform: scale(0.7); /* Memperkecil ukuran panah */
        }
        .swiper-pagination-bullet-active {
            background: white !important;
        }
        .swiper-pagination-bullet {
            background: rgba(255,255,255,0.5);
        }
      `}</style>
    </div>
  );
}