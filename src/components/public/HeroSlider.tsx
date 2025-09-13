// src/app/(public)/HeroSlider.tsx
'use client'
import { useEffect, useRef } from 'react'

export default function HeroSlider({ images }: { images: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tns: any = (window as any)?.tns
    const el = containerRef.current
    if (!tns || !el || el.dataset.tnsInited) return
    el.dataset.tnsInited = 'true'
    tns({
      container: el,
      items: 1,
      slideBy: 1,
      autoplay: true,
      autoplayTimeout: 5000,
      autoplayButtonOutput: false,
      controls: false,
      nav: true,
      mouseDrag: true,
      gutter: 0,
    })
  }, [])

  return (
    <div className="hero">
      <div className="hero-slide" ref={containerRef}>
        {images.map((src, i) => (
          <div
            key={i}
            className="img overlay"
            style={{
              backgroundImage: `url('${src}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '80vh',
            }}
          />
        ))}
      </div>

      {/* ===== Teks & CTA di atas gambar ===== */}
      <div className="hero-content">
        <div className="container text-center">
          <h1 className="heading mb-3" data-aos="fade-up">
            Selamat Datang di Penginapan Pondok Pesantren Darul Falah Amtsilati
          </h1>
          <p className="hero-sub mb-4" data-aos="fade-up" data-aos-delay="100">
            Kenyamanan Anda adalah prioritas kami. Temukan kamar yang sesuai dengan kebutuhan Anda di bawah ini.
          </p>
          <a
            href="/properties"
            className="btn btn-primary btn-compact"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            Lihat daftar kamar
          </a>
        </div>
      </div>
    </div>
  )
}
