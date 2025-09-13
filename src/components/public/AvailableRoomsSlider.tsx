'use client'
import { useEffect, useRef } from 'react'
import RoomCard from './RoomCard'

export default function AvailableRoomsSlider({ rooms }: { rooms: any[] }) {
  const sliderRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const tns: any = (window as any).tns
    const el = sliderRef.current
    if (!tns || !el) return
    if (el.dataset.tnsInited === 'true') return
    el.dataset.tnsInited = 'true'

    const count = rooms.length
    const itemsMobile  = Math.min(count, 1)
    const itemsTablet  = Math.min(count, 2)
    const itemsDesktop = Math.min(count, 3)
    const enableLoop   = count > itemsDesktop   // loop hanya jika slide cukup
    const enableMulti  = count > 1

    tns({
      container: el,
      items: itemsMobile,
      gutter: 30,
      slideBy: 1,
      mouseDrag: enableMulti,
      autoplay: enableMulti,
      autoplayButtonOutput: false,
      controlsContainer: '#property-nav',
      nav: false,
      loop: enableLoop,
      rewind: !enableLoop,       // kalau tidak loop, rewind supaya balik ke awal
      edgePadding: 0,
      center: false,
      responsive: {
        700: { items: itemsTablet },
        992: { items: itemsDesktop },
      },
      onInit: () => el.classList.remove('is-loading'),
    })
  }, [rooms])

  return (
    <div className="section">
      <div className="container">
        <div className="row mb-5 align-items-center">
          <div className="col-lg-6">
            <h2 className="font-weight-bold text-primary heading">Daftar Kamar Tersedia</h2>
          </div>
          <div className="col-lg-6 text-lg-end">
            <span id="property-nav" className="controls">
              <span className="prev me-3" data-controls="prev">
                <span className="icon-keyboard_arrow_left"></span>
              </span>
              <span className="next" data-controls="next">
                <span className="icon-keyboard_arrow_right"></span>
              </span>
            </span>
          </div>
        </div>

        <div className="property-slider-wrap">
          <div ref={sliderRef} className="property-slider is-loading">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
