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

  const card = (
    <div className="property-item mb-30" data-aos="fade-up">
      {/* Gambar tidak clickable */}
      <div className="img">
        <img
          src="/images/img_1.jpg"
          alt={`Kamar ${room.roomNumber}`}
          className="img-fluid w-100"
        />
      </div>

      <div className="property-content">
        {!room.property.isFree && room.roomType && (
          <div className="price mb-2">
            <span>Rp {room.roomType.priceFullDay?.toLocaleString("id-ID")} / hari</span>
          </div>
        )}

        <div>
          <span className="d-block mb-2 text-black-50">{room.property.name}</span>
          <span className="city d-block mb-3">Kamar {room.roomNumber}</span>

          {/* Tombol aksi */}
          <div className="d-flex gap-2 flex-wrap">
            <Link
              href={`/properties/${room.id}`}
              className="btn btn-outline-primary py-2 px-3"
              prefetch={false}
            >
              Lihat detail
            </Link>

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary py-2 px-3"
            >
              Hubungi via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  // Jika dipakai di grid biasa: <RoomCard wrap />
  return wrap ? <div className="col-12 col-sm-6 col-lg-4">{card}</div> : card;
}
