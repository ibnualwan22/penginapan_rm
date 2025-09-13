import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

// Data deskripsi dan fasilitas kita tulis di sini
const roomDetails: { [key: string]: { description: string, facilities: string[] } } = {
  '101': {
    description: "Kamar spesial di lantai 1 dengan fasilitas lengkap untuk kenyamanan maksimal. Pemandangan langsung ke taman.",
    facilities: ["Air Conditioner", "Televisi Layar Datar", "Kamar Mandi Dalam", "Air Hangat", "Perlengkapan Sholat"]
  },
  'Hasan': {
    description: "Villa eksklusif dengan ruang tamu terpisah, memberikan privasi dan kemewahan. Sangat cocok untuk keluarga.",
    facilities: ["AC di Setiap Ruang", "Smart TV", "Dapur Kecil", "Kamar Mandi Dalam", "Sofa & Ruang Tamu"]
  },
  // Tambahkan detail untuk kamar lain di sini...
  'default': {
    description: "Kamar standar yang bersih dan nyaman, dilengkapi dengan semua kebutuhan dasar untuk istirahat yang tenang.",
    facilities: ["Air Conditioner", "Televisi", "Kamar Mandi Dalam"]
  }
};

async function getRoom(id: string) {
  return prisma.room.findUnique({
    where: { id },
    include: {
      property: true,
      roomType: true,
    },
  });
}


export default async function PropertySinglePage(props: { params: Promise<{ id: string }> }) {
  // 🔑 harus di-await sekarang
  const { id } = await props.params;

  const room = await getRoom(id);
  if (!room) return notFound();

  const key = String(room.roomNumber);
  const details = roomDetails[key] ?? roomDetails.default;

  const isRM = room.property.name === 'Penginapan RM';
  const waNumber = isRM ? '6285842817105' : '6285741193660';
  const waMessage = `Assalamu'alaikum, saya ingin menanyakan ketersediaan Kamar ${room.roomNumber} di ${room.property.name}.`;
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

  return (
   <div className="pt-nav">
    <div className="section">
      <div className="container">
        <div className="row justify-content-between">
          <div className="col-lg-7">
            <div className="img-property-slide-wrap">
              <div className="img-property-slide">
                <img src="/images/img_1.jpg" alt="Image 1" className="img-fluid" />
                <img src="/images/img_2.jpg" alt="Image 2" className="img-fluid" />
                <img src="/images/img_3.jpg" alt="Image 3" className="img-fluid" />
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <h2 className="heading text-primary">Kamar {room.roomNumber}</h2>
            <p className="meta">{room.property.name}</p>

            {!room.property.isFree && room.roomType && (
              <h3 className="text-black mb-4">
                Mulai dari <strong>Rp {room.roomType?.priceHalfDay?.toLocaleString('id-ID')}</strong>
              </h3>
            )}

            <p className="text-black-50">{details.description}</p>

            <h3 className="h5 text-black mb-3 mt-4">Fasilitas:</h3>
            <ul className="list-unstyled">
              {details.facilities.map((f, i) => <li key={i} className="mb-2">✓ {f}</li>)}
            </ul>

            <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary py-2 px-3 mt-4">
              Hubungi via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
