import prisma from "@/lib/prisma";
import RoomCard from "@/components/public/RoomCard";
import HeroSlider from "@/components/public/HeroSlider"; // <-- 1. Impor komponen baru
import AvailableRoomsSlider from "@/components/public/AvailableRoomsSlider"; // <-- Impor komponen slider



// Ambil data kamar tersedia langsung dari database
async function getAvailableRooms() {
  return prisma.room.findMany({
    where: { status: 'AVAILABLE' },
    select: {
      id: true,
      roomNumber: true,
      property: { select: { id: true, name: true, isFree: true } },
      roomType: { select: { name: true, priceHalfDay: true, priceFullDay: true } },
    },
    orderBy: [{ property: { name: 'asc' }}, { roomNumber: 'asc' }],
  });
}

// Ambil data statistik langsung dari database
async function getStats() {
    const rmBookings = await prisma.booking.count({ where: { checkOut: { not: null }, room: { property: { name: 'Penginapan RM' } } } });
    const rjBookings = await prisma.booking.count({ where: { checkOut: { not: null }, room: { property: { name: 'Raudlatul Jannah' } } } });
    return { rmBookings, rjBookings };
}

export default async function HomePage() {
  const availableRooms = await getAvailableRooms();
  const stats = await getStats();

  return (
    <>
      <HeroSlider images={[
        '/images/hero_bg_1.jpg',
        '/images/hero_bg_2.jpg',
        '/images/hero_bg_3.jpg',
      ]} />

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