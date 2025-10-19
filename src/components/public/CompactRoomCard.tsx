import Link from "next/link";

type RoomImage = { id: string; url: string };
type RoomType = { priceFullDay?: number | null };
type Room = {
  id: string;
  roomNumber: string;
  status?: "OCCUPIED" | "AVAILABLE" | string;
  property: { name: string; isFree: boolean };
  roomType?: RoomType | null;
  images?: RoomImage[];
};

export default function RoomCard({ room }: { room: Room }) {
  // Gratis jika flag isFree true ATAU nama properti mengandung "Raudlatul Jannah"
  const isRJFree = room.property.isFree || /raudlatul\s*jannah/i.test(room.property.name);

  // Foto pertama, fallback placeholder
  const placeholder = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 675'>
       <rect width='100%' height='100%' fill='#e5e7eb'/>
       <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
             fill='#6b7280' font-size='40' font-family='sans-serif'>
         Foto belum tersedia
       </text>
     </svg>`
  )}`;
  const imageUrl = room.images?.[0]?.url ?? placeholder;

  const isRM = room.property.name === "Penginapan RM";
  const waNumber = isRM ? "6285842817105" : "6285741193660";
  const waMessage = `Assalamu'alaikum, saya ingin menanyakan ketersediaan Kamar ${room.roomNumber} di ${room.property.name}.`;
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

  const price =
    isRJFree
      ? "Gratis"
      : room.roomType?.priceFullDay != null
      ? `Rp ${Number(room.roomType.priceFullDay).toLocaleString("id-ID")} / hari`
      : undefined;

  return (
    <div className="rounded-xl overflow-hidden border bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Gambar besar (responsif) */}
      <div className="relative w-full h-56 sm:h-64 md:h-72 lg:h-80 overflow-hidden">
        <Link href={`/properties/${room.id}`} className="block" prefetch={false}>
          <img
            src={imageUrl}
            alt={`Foto Kamar ${room.roomNumber}`}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </Link>
      </div>

      {/* Konten */}
      <div className="p-4">
        {price && (
          <div className="mb-2">
            <span className="text-teal-800 font-semibold text-lg sm:text-xl">
              {price}
            </span>
            {!isRJFree && <div className="h-[2px] bg-teal-800 w-36 mt-1" />}
          </div>
        )}

        <span className="block text-xs text-gray-500">{room.property.name}</span>
        <h3 className="text-xl font-semibold mt-1">Kamar {room.roomNumber}</h3>

        <div className="mt-3 flex gap-2 flex-wrap">
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
  );
}
