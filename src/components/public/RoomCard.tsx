import Link from "next/link";

type Room = {
  id: string;
  roomNumber: string;
  property: { name: string; isFree: boolean };
  roomType?: { priceFullDay?: number };
};

export default function RoomCard({ room, wrap = false }: { room: Room; wrap?: boolean }) {
  const isRM = room.property.name === "Penginapan RM";
  const waNumber = isRM ? "6285842817105" : "6285741193660";
  const waMessage = `Assalamu'alaikum, saya ingin menanyakan ketersediaan Kamar ${room.roomNumber} di ${room.property.name}.`;
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

  // Anggap gratis jika flag isFree true ATAU nama properti berisi "Raudlatul Jannah"
  const isRJFree =
    room.property.isFree ||
    /raudlatul\s*jannah/i.test(room.property.name);

  // Tentukan teks harga
  let priceNode: React.ReactNode = null;
  if (isRJFree) {
    priceNode = <span>Gratis</span>;
  } else if (room.roomType?.priceFullDay) {
    priceNode = (
      <span>
        Rp {room.roomType.priceFullDay.toLocaleString("id-ID")} / hari
      </span>
    );
  }

  const card = (
    <div className="property-item mb-30" data-aos="fade-up">
      {/* Gambar tidak clickable */}
      <div className="img">
        <img
          src="/images/img_1.jpg"
          alt={`Kamar ${room.roomNumber}`}
          className="img-fluid w-10"
        />
      </div>

      <div className="property-content">
        {/* Selalu render container harga bila ada priceNode */}
        {priceNode && <div className="price mb-2">{priceNode}</div>}

        <div>
          <span className="d-block mb-2 text-black-50">{room.property.name}</span>
          <span className="city d-block mb-3">Kamar {room.roomNumber}</span>

          {/* Tombol aksi */}
          <div className="d-flex gap-2 flex-wrap">
            <Link
              href={`/properties/${room.id}`}
              className="btn btn-outline-primary btn-sm"
              prefetch={false}
            >
              Lihat detail
            </Link>

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
            >
              Hubungi via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  return wrap ? <div className="col-12 col-sm-6 col-lg-4">{card}</div> : card;
}
