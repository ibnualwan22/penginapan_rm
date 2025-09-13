// src/app/(public)/HeroSlider.tsx
'use client'
import { useEffect, useRef } from 'react'

export default function HeroSlider({ images }: { images: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // @ts-ignore
    const tns = (window as any)?.tns
    const el = containerRef.current
    if (!tns || !el || el.dataset.tnsInited) return

    // tandai agar tidak inisialisasi 2x saat hot reload
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
              minHeight: '80vh', // jaga tinggi
            }}
          />
        ))}
      </div>

      {/* konten teks di atas slider */}
      <div className="container">
        <div className="row justify-content-center align-items-center">
          <div className="col-lg-9 text-center">
            <h1 className="heading" data-aos="fade-up">
              Selamat Datang di Penginapan Pondok Pesantren Roudlatul Muta'alimin
            </h1>
            <p data-aos="fade-up">
              Kenyamanan Anda adalah prioritas kami. Temukan kamar yang sesuai dengan kebutuhan Anda di bawah ini.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
