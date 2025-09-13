import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function CompactRoomCard({ room }: { room: any }) {
  const isOccupied = room.status === "OCCUPIED";
  const isRM = room.property.name === "Penginapan RM";
  const waNumber = isRM ? "6285842817105" : "6285741193660";
  const waMessage = `Assalamu'alaikum, saya ingin menanyakan ketersediaan Kamar ${room.roomNumber} di ${room.property.name}.`;
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

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
          src="/images/img_2.jpg"
          alt={`Kamar ${room.roomNumber}`}
          className="w-full h-full object-cover"
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

          {!room.property.isFree && room.roomType && (
            <p className="text-sm text-primary font-bold">
              Rp {room.roomType.priceFullDay.toLocaleString("id-ID")} / hari
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
