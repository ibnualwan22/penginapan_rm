import prisma from "@/lib/prisma";
import CreateRoomForm from "@/components/rooms/CreateRoomForm";

// Ambil data tipe kamar di server
async function getRoomTypes() {
    return prisma.roomType.findMany();
}

export default async function NewRoomPage() {
    const roomTypes = await getRoomTypes();

    return (
        <div className="p-8 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-4">Tambah Kamar Baru</h1>
            <CreateRoomForm roomTypes={roomTypes} />
        </div>
    );
}