import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CreateUserForm from "@/components/auth/CreateUserForm";
import EditUserForm from "@/components/auth/EditUserForm"; // <-- Impor baru
import DeleteUserButton from "@/components/auth/DeleteUserButton"; // <-- Impor baru
import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function getUsers() {
    const users = await prisma.user.findMany({
        include: { role: true },
        orderBy: { name: 'asc' },
    });
    return users.map(({ password, ...user }) => user);
}

async function getRoles() {
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
                                            {canDelete && <DeleteUserButton userId={user.id} />}
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