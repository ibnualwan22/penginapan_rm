import prisma from "@/lib/prisma";
import EditRoomForm from "@/components/rooms/EditRoomForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Ambil data untuk satu kamar spesifik
async function getRoom(id: string) {
    return prisma.room.findUnique({
        where: { id },
        include: { property: true } // Sertakan info properti
    });
}

// Fungsi ini sama seperti di halaman 'new'
async function getRoomTypes() {
    return prisma.roomType.findMany();
}
async function getManagedProperties() {
    const session = await getServerSession(authOptions);
    return session?.user?.managedProperties || [];
}
async function getAllProperties() {
    return prisma.property.findMany();
}

export default async function EditRoomPage({ params }: { params: { id: string }}) {
    const { id } = params;

    // Ambil semua data yang dibutuhkan
    const room = await getRoom(id);
    const roomTypes = await getRoomTypes();
    const managedProperties = await getManagedProperties();
    const allProperties = await getAllProperties();

    if (!room) {
        return <p>Kamar tidak ditemukan.</p>;
    }

    return (
        <div className="p-8 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-4">Edit Kamar</h1>
            <EditRoomForm 
                room={room}
                roomTypes={roomTypes}
                managedProperties={managedProperties}
                properties={allProperties}
            />
        </div>
    );
}