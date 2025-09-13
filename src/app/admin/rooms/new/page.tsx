import prisma from "@/lib/prisma";
import CreateRoomForm from "@/components/rooms/CreateRoomForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Ambil semua data yang dibutuhkan oleh form
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

export default async function NewRoomPage() {
    // Panggil semua fungsi data fetching
    const roomTypes = await getRoomTypes();
    const managedProperties = await getManagedProperties();
    const allProperties = await getAllProperties();

    return (
        <div className="p-8 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-4">Tambah Kamar Baru</h1>
            {/* Kirim semua data sebagai props ke form */}
            <CreateRoomForm 
                roomTypes={roomTypes} 
                managedProperties={managedProperties} 
                properties={allProperties}
            />
        </div>
    );
}