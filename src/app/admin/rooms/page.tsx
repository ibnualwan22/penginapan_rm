import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DeleteRoomButton from '@/components/DeleteRoomButton'; // Pastikan path ini benar
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function getRooms() {
    // --- PERUBAHAN DI SINI ---
    // Sertakan data dari relasi roomType
    return prisma.room.findMany({ 
        orderBy: { roomNumber: 'asc' },
        include: {
            roomType: true 
        }
    });
}

export default async function RoomsPage() {
    const session = await getServerSession(authOptions);
    const userPermissions = session?.user?.permissions || [];
    
    const canCreate = userPermissions.includes('rooms:create');
    const canUpdate = userPermissions.includes('rooms:update');
    const canDelete = userPermissions.includes('rooms:delete');

    const rooms = await getRooms();

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manajemen Kamar</h1>
                {canCreate && (
                    <Button asChild>
                        <Link href="/admin/rooms/new">Tambah Kamar Baru</Link>
                    </Button>
                )}
            </div>
            
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nomor Kamar</TableHead>
                            <TableHead>Lantai</TableHead>
                            <TableHead>Tipe</TableHead>
                            <TableHead>Status</TableHead>
                            {(canUpdate || canDelete) && <TableHead className="text-center">Aksi</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rooms.map((room: any) => (
                            <TableRow key={room.id}>
                                <TableCell className="font-medium">{room.roomNumber}</TableCell>
                                <TableCell>{room.floor}</TableCell>
                                {/* --- PERUBAHAN DI SINI --- */}
                                {/* Tampilkan nama dari relasi roomType */}
                                <TableCell>{room.roomType.name}</TableCell>
                                <TableCell>{room.status}</TableCell>
                                {(canUpdate || canDelete) && (
                                    <TableCell className="text-center">
                                        <div className="flex item-center justify-center space-x-4">
                                            {canUpdate && <Link href={`/admin/rooms/edit/${room.id}`} className="text-blue-600 hover:text-blue-900">Edit</Link>}
                                            {canDelete && <DeleteRoomButton roomId={room.id} />}
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

