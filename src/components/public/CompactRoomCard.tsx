import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type RoomImage = { id: string; url: string };
type RoomType = { priceFullDay?: number | null };
type Room = {
  id: string;
  roomNumber: string;
  status: "OCCUPIED" | "AVAILABLE" | string;
  images?: RoomImage[];
  property: { name: string; isFree?: boolean };
  roomType?: RoomType | null;
};

export default function CompactRoomCard({ room }: { room: Room }) {
  const isOccupied = room.status === "OCCUPIED";
  const isRM = room.property.name === "Penginapan RM";

  // Ambil foto pertama; siapkan placeholder SVG bila kosong
  const placeholder = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'>
       <rect width='100%' height='100%' fill='#e5e7eb'/>
       <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
             fill='#6b7280' font-size='24' font-family='sans-serif'>
         Foto belum tersedia
       </text>
     </svg>`
  )}`;
  const imageUrl = room.images?.[0]?.url ?? placeholder;

  const waNumber = isRM ? "6285842817105" : "6285741193660";
  const waMessage = `Assalamu'alaikum, saya ingin menanyakan ketersediaan Kamar ${room.roomNumber} di ${room.property.name}.`;
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

  const price = room.roomType?.priceFullDay ?? null;

  return (
    <div
      className={`w-full border rounded-lg overflow-hidden flex ${
        isOccupied ? "bg-gray-50" : "bg-white"
      }`}
      data-aos="fade-up"
    >
      {/* Gambar */}
      <div className="w-1/3">
        <img
          src={imageUrl}
          alt={`Foto Kamar ${room.roomNumber}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Konten */}
      <div className="w-2/3 p-4 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500">{room.property.name}</span>
            {isOccupied && <Badge variant="default">Terisi</Badge>}
          </div>

          <h3 className="font-semibold text-lg mt-1">Kamar {room.roomNumber}</h3>

          {!room.property.isFree && price != null && (
            <p className="text-sm text-primary font-bold">
              Rp {Number(price).toLocaleString("id-ID")} / hari
            </p>
          )}
        </div>

        {/* Tombol aksi (kecil) */}
        <div className="mt-3 flex gap-2 flex-wrap">
          <Link
            href={`/properties/${room.id}`}
            prefetch={false}
            className="btn btn-outline-primary btn-sm"
            style={{ whiteSpace: "nowrap" }}
          >
            Lihat detail
          </Link>

          <a
            href={isOccupied ? "#" : waLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={isOccupied}
            tabIndex={isOccupied ? -1 : 0}
            className={`btn btn-primary btn-sm ${
              isOccupied ? "pointer-events-none opacity-60" : ""
            }`}
            style={{ whiteSpace: "nowrap" }}
          >
            {isOccupied ? "Tidak Tersedia" : "Tanya Ketersediaan"}
          </a>
        </div>
      </div>
    </div>
  );
}
