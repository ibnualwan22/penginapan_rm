// 1) Paksa halaman ini dinamis (tidak di-prerender)
export const dynamic = 'force-dynamic';
// atau bisa juga:
// export const revalidate = 0;

import { unstable_noStore as noStore } from 'next/cache';
import prisma from "@/lib/prisma";
import RoomCard from "@/components/public/RoomCard";
import HeroSlider from "@/components/public/HeroSlider";
import AvailableRoomsSlider from "@/components/public/AvailableRoomsSlider";

// Ambil data kamar tersedia langsung dari database (no cache)
async function getAvailableRooms() {
  noStore(); // 2) Jangan cache hasil query ini
  return prisma.room.findMany({
    where: { status: 'AVAILABLE' }, // pastikan enum di DB benar2 'AVAILABLE'
    select: {
      id: true,
      roomNumber: true,
      property: { select: { id: true, name: true, isFree: true } },
      roomType: { select: { name: true, priceHalfDay: true, priceFullDay: true } },
    },
    orderBy: [{ property: { name: 'asc' } }, { roomNumber: 'asc' }],
  });
}

async function getStats() {
  noStore(); // 3) Jangan cache statistik juga
  const rmBookings = await prisma.booking.count({
    where: { checkOut: { not: null }, room: { property: { name: 'Penginapan RM' } } }
  });
  const rjBookings = await prisma.booking.count({
    where: { checkOut: { not: null }, room: { property: { name: 'Raudlatul Jannah' } } }
  });
  return { rmBookings, rjBookings };
}

export default async function HomePage() {
  const availableRooms = await getAvailableRooms();
  const stats = await getStats();

  return (
    <>
      <HeroSlider images={["/images/hero_bg_1.jpg","/images/hero_bg_2.jpg","/images/hero_bg_3.jpg"]} />
      {availableRooms.length > 0 ? (
        <AvailableRoomsSlider rooms={availableRooms} />
      ) : (
        <div className="section">
          <div className="container text-center">
            <h2 className="font-weight-bold text-primary heading">Daftar Kamar Tersedia</h2>
            <p>Mohon maaf, saat ini tidak ada kamar yang tersedia.</p>
          </div>
        </div>
      )}
      <div className="section sec-testimonials bg-light">
        <div className="container">
          <div className="row mb-5 align-items-center">
            <div className="col-md-6">
              <h2 className="font-weight-bold heading text-primary mb-4 mb-md-0">Statistik Layanan Kami</h2>
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 col-lg-4">
              <div className="stats-item">
                <span className="font-weight-bold h1">{stats.rmBookings}</span>
                <span className="d-block">Total Reservasi (Penginapan RM)</span>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="stats-item">
                <span className="font-weight-bold h1">{stats.rjBookings}</span>
                <span className="d-block">Total Reservasi (Raudlatul Jannah)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
