import Link from "next/link";

type RoomImage = { id: string; url: string };
type RoomType = { priceFullDay?: number | null };
type Room = {
  id: string;
  roomNumber: string;
  // Pastikan backend mengirim status 'MAINTENANCE' jika sedang perbaikan
  status?: "OCCUPIED" | "AVAILABLE" | "MAINTENANCE" | string;
  property: { name: string; isFree: boolean };
  roomType?: RoomType | null;
  images?: RoomImage[];
};

export default function RoomCard({ room }: { room: Room }) {
  // 1. Cek Status Ketersediaan
  const isOccupied = room.status === "OCCUPIED";
  const isMaintenance = room.status === "MAINTENANCE";
  const isAvailable = !isOccupied && !isMaintenance; // Bisa dipencet hanya jika Available

  // Label Status untuk UI
  let statusLabel = "";
  let statusColor = "";

  if (isOccupied) {
    statusLabel = "TERISI";
    statusColor = "bg-red-600";
  } else if (isMaintenance) {
    statusLabel = "DALAM PERAWATAN";
    statusColor = "bg-yellow-600";
  }

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
    <div className={`rounded-xl overflow-hidden border bg-white shadow-sm transition-shadow ${isAvailable ? 'hover:shadow-md' : 'opacity-80'}`}>
      
      {/* BAGIAN GAMBAR */}
      <div className="relative w-full h-56 sm:h-64 md:h-72 lg:h-80 overflow-hidden">
        {/* Jika Available, bungkus dengan Link. Jika tidak, div biasa */}
        {isAvailable ? (
          <Link href={`/properties/${room.id}`} className="block h-full" prefetch={false}>
            <img
              src={imageUrl}
              alt={`Foto Kamar ${room.roomNumber}`}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              loading="lazy"
            />
          </Link>
        ) : (
          <div className="h-full w-full relative">
            <img
              src={imageUrl}
              alt={`Foto Kamar ${room.roomNumber}`}
              className="absolute inset-0 w-full h-full object-cover grayscale" // Efek hitam putih
              loading="lazy"
            />
            {/* Overlay Status (Gelap + Teks) */}
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
              <span className={`${statusColor} text-white px-4 py-2 rounded font-bold text-sm tracking-wide shadow-lg`}>
                {statusLabel}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* KONTEN */}
      <div className="p-4">
        {price && (
          <div className="mb-2">
            <span className={`font-semibold text-lg sm:text-xl ${isAvailable ? 'text-teal-800' : 'text-gray-500'}`}>
              {price}
            </span>
            {!isRJFree && <div className={`h-[2px] w-36 mt-1 ${isAvailable ? 'bg-teal-800' : 'bg-gray-300'}`} />}
          </div>
        )}

        <span className="block text-xs text-gray-500">{room.property.name}</span>
        <h3 className={`text-xl font-semibold mt-1 ${!isAvailable && 'text-gray-600'}`}>
            Kamar {room.roomNumber}
        </h3>

        {/* TOMBOL AKSI */}
        <div className="mt-3 flex gap-2 flex-wrap">
          {isAvailable ? (
            // Jika Available: Tampilkan Tombol Normal
            <>
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
            </>
          ) : (
            // Jika Tidak Available: Tampilkan Tombol Disabled
            <button
              disabled
              className="w-full py-2 px-4 bg-gray-100 text-gray-500 rounded border border-gray-200 text-sm font-medium cursor-not-allowed text-center"
            >
              {isOccupied ? "Kamar Sedang Terisi" : "Sedang Dalam Perbaikan"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}