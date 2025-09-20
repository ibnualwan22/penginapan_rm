import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DeleteRoomButton from '@/components/DeleteRoomButton';
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import PropertyFilter from '@/components/dashboard/PropertyFilter'; // Gunakan kembali filter yang sudah ada

async function getFilteredRooms(selectedPropertyId?: string | null) {
  const session = await getServerSession(authOptions);
  const managedPropertyIds = session?.user?.managedProperties?.map(p => p.id) || [];

  if (managedPropertyIds.length === 0) return [];

  const propertyFilter = selectedPropertyId ? [selectedPropertyId] : managedPropertyIds;

  return prisma.room.findMany({ 
      where: {
        propertyId: { in: propertyFilter },
      },
      orderBy: { roomNumber: 'asc' },
      include: {
          roomType: true,
          property: true, // Sertakan data properti
      }
  });
}

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
}) {
  const sp = await searchParams; // ✅ await dulu

  const raw = sp?.propertyId;
  const selectedPropertyId =
    Array.isArray(raw) ? (raw[0] as string | undefined) : (raw as string | undefined);

  const session = await getServerSession(authOptions);
  const userPermissions = session?.user?.permissions || [];
  const managedProperties = session?.user?.managedProperties || [];

  const canCreate = userPermissions.includes('rooms:create');
  const canUpdate = userPermissions.includes('rooms:update');
  const canDelete = userPermissions.includes('rooms:delete');

  const rooms = await getFilteredRooms(selectedPropertyId);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manajemen Kamar</h1>
                <div className="flex items-center space-x-2">
                    <PropertyFilter properties={managedProperties} />
                    {canCreate && (
                        <Button asChild>
                            <Link href="/admin/rooms/new">Tambah Kamar Baru</Link>
                        </Button>
                    )}
                </div>
            </div>
            
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nomor Kamar</TableHead>
                            <TableHead>Properti</TableHead>
                            <TableHead>Tipe</TableHead>
                            <TableHead>Status</TableHead>
                            {(canUpdate || canDelete) && <TableHead className="text-center">Aksi</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rooms.map((room: any) => (
                            <TableRow key={room.id}>
                                <TableCell className="font-medium">{room.roomNumber}</TableCell>
                                <TableCell>{room.property.name}</TableCell>
                                <TableCell>{room.property.isFree ? 'N/A' : room.roomType.name}</TableCell>
                                <TableCell>{room.status}</TableCell>
                                {(canUpdate || canDelete) && (
                                    <TableCell className="text-center">
                                        <div className="flex item-center justify-center space-x-4">
                                            <Link href={`/admin/rooms/${room.id}/photos`} className="text-green-600 hover:text-green-900 text-xs">Foto</Link>
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