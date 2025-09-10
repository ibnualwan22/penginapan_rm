import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CreateRoleForm from "@/components/auth/CreateRoleForm";
import EditRoleForm from "@/components/auth/EditRoleForm";
import DeleteRoleButton from "@/components/auth/DeleteRoleButton";
import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Role, Permission, RolePermission } from "@prisma/client";

type RoleWithPermissions = Role & {
  permissions: (RolePermission & {
    permission: Permission;
  })[];
};

async function getRoles(): Promise<RoleWithPermissions[]> {
    return prisma.role.findMany({
        include: { permissions: { include: { permission: true } } },
        orderBy: { name: 'asc' },
    });
}

async function getPermissions(): Promise<Permission[]> {
    return prisma.permission.findMany({ orderBy: { name: 'asc' } });
}

export default async function RolesPage() {
    const session = await getServerSession(authOptions);
    const userPermissions = session?.user?.permissions || [];
    const canCreate = userPermissions.includes('roles:create');
    const canUpdate = userPermissions.includes('roles:update');
    const canDelete = userPermissions.includes('roles:delete');
    
    const roles = await getRoles();
    const permissions = await getPermissions();

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manajemen Peran & Izin</h1>
                {canCreate && (
                    <Dialog>
                        <DialogTrigger asChild><Button>Tambah Peran Baru</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Buat Peran Baru</DialogTitle></DialogHeader>
                            <CreateRoleForm permissions={permissions} />
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map((role: RoleWithPermissions) => (
                    <Card key={role.id} className="flex flex-col">
                        <CardHeader><CardTitle>{role.name}</CardTitle></CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground mb-4">{role.description || 'Tidak ada deskripsi.'}</p>
                            <h4 className="font-semibold mb-2">Izin:</h4>
                            <ul className="list-disc list-inside text-sm space-y-1">
                                {role.permissions.map(({ permission }: { permission: Permission }) => (
                                    <li key={permission.id}>{permission.name}</li>
                                ))}
                            </ul>
                        </CardContent>
                        {(canUpdate || canDelete) && (
                            <CardFooter className="space-x-2">
                                {canUpdate && (
                                    <Dialog>
                                        <DialogTrigger asChild><Button variant="outline" className="w-full">Edit</Button></DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader><DialogTitle>Edit Peran</DialogTitle></DialogHeader>
                                            <EditRoleForm role={role} permissions={permissions} />
                                        </DialogContent>
                                    </Dialog>
                                )}
                                {canDelete && <DeleteRoleButton roleId={role.id} />}
                            </CardFooter>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}