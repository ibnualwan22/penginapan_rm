import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ImageGallery from "@/components/public/ImageGallery";

// Data deskripsi statis boleh tetap dipertahankan jika belum masuk DB
const descriptions: { [key: string]: string } = {
  'default': "Kamar yang nyaman, bersih, dan tenang untuk istirahat Anda."
};

async function getRoom(id: string) {
  return prisma.room.findUnique({
    where: { id },
    include: {
      property: true,
      roomType: true, // Ambil fasilitas dari sini
      images: true,
    },
  });
}

export default async function PropertySinglePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const room = await getRoom(id);
  if (!room) return notFound();

  const isRM = room.property.name === 'Penginapan RM';
  const waNumber = isRM ? '6285842817105' : '6285741193660';
  const waMessage = `Assalamu'alaikum, saya ingin menanyakan ketersediaan Kamar ${room.roomNumber} di ${room.property.name}.`;
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

  // Ambil fasilitas dari Database (jika ada), jika tidak pakai default kosong
  const facilities = room.roomType?.facilities || [];
  
  // Ambil harga
  const priceDisplay = room.roomType?.priceHalfDay 
    ? `Mulai dari Rp ${room.roomType.priceHalfDay.toLocaleString('id-ID')}`
    : 'Hubungi Kami untuk Harga';

  return (
   <div className="pt-nav">
    <div className="section">
      <div className="container">
        <div className="row justify-content-between">
          <div className="col-lg-7">
            <div className="img-property-slide-wrap">
              <div className="mb-5"> {/* Hapus class lama 'img-property-slide-wrap' jika template bawaan mengganggu */}
               {/* Panggil komponen Gallery di sini */}
               <ImageGallery images={room.images} />
            </div>
            </div>
          </div>

          <div className="col-lg-4">
            <h2 className="heading text-primary">Kamar {room.roomNumber}</h2>
            <p className="meta">{room.property.name} - {room.roomType?.name || 'Standard'}</p>

            {!room.property.isFree && (
              <h3 className="text-black mb-4">
                <strong>{priceDisplay}</strong>
              </h3>
            )}

            <p className="text-black-50">{descriptions['default']}</p>

            {/* [UPDATE] Fasilitas Dinamis */}
            {facilities.length > 0 && (
                <>
                    <h3 className="h5 text-black mb-3 mt-4">Fasilitas:</h3>
                    <ul className="list-unstyled">
                    {facilities.map((f, i) => (
                        <li key={i} className="mb-2 flex items-center">
                            <span className="text-green-500 mr-2">✓</span> {f}
                        </li>
                    ))}
                    </ul>
                </>
            )}

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