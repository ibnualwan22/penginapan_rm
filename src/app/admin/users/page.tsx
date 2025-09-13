import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CreateUserForm from "@/components/auth/CreateUserForm";
import EditUserForm from "@/components/auth/EditUserForm";
import DeleteUserButton from "@/components/auth/DeleteUserButton";
import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function getUsers() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return [];

    const { role, managedProperties } = session.user;
    const whereClause: any = {};

    if (role !== 'Super Administrator') {
        const managedPropertyIds = managedProperties.map(p => p.id);
        whereClause.properties = {
            some: { propertyId: { in: managedPropertyIds } },
        };
        // --- PERBAIKAN PENTING ---
        // Jangan pernah tampilkan Super Admin kepada non-super admin
        whereClause.role = {
            name: {
                not: 'Super Administrator'
            }
        };
    }

    const users = await prisma.user.findMany({
        where: whereClause,
        include: { role: true },
        orderBy: { name: 'asc' },
    });
    return users.map(({ password, ...user }) => user);
}

async function getRoles() {
    const session = await getServerSession(authOptions);
    // Jika bukan Super Admin, hanya bisa membuat user dengan peran 'Admin Properti' atau lebih rendah
    if (session?.user?.role !== 'Super Administrator') {
        return prisma.role.findMany({ 
            where: { 
                name: {
                    not: 'Super Administrator'
                }
            }
        });
    }
    // Super Admin bisa memilih semua peran
    return prisma.role.findMany({ orderBy: { name: 'asc' } });
}

export default async function UsersPage() {
    const session = await getServerSession(authOptions);
    const userPermissions = session?.user?.permissions || [];
    const canCreate = userPermissions.includes('users:create');
    const canUpdate = userPermissions.includes('users:update');
    const canDelete = userPermissions.includes('users:delete');
    
    const users = await getUsers();
    const roles = await getRoles();

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manajemen Pengguna</h1>
                {canCreate && (
                    <Dialog>
                        <DialogTrigger asChild><Button>Tambah Pengguna Baru</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Buat Pengguna Baru</DialogTitle></DialogHeader>
                            <CreateUserForm roles={roles} />
                        </DialogContent>
                    </Dialog>
                )}
            </div>
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Peran (Role)</TableHead>
                            {(canUpdate || canDelete) && <TableHead className="text-right">Aksi</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.role.name}</TableCell>
                                {(canUpdate || canDelete) && (
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            {canUpdate && (
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="outline" size="sm">Edit</Button></DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader><DialogTitle>Edit Pengguna</DialogTitle></DialogHeader>
                                                        <EditUserForm user={user} roles={roles} />
                                                    </DialogContent>
                                                </Dialog>
                                            )}
                                            {/* Jangan izinkan pengguna menghapus dirinya sendiri */}
                                            {canDelete && user.id !== session?.user?.id && <DeleteUserButton userId={user.id} />}
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