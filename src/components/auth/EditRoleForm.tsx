'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Permission } from "@prisma/client";

export default function EditRoleForm({ role, permissions }: { role: any, permissions: Permission[] }) {
    const router = useRouter();
    const [name, setName] = useState(role.name);
    const [description, setDescription] = useState(role.description || '');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
        role.permissions.map((p: any) => p.permissionId)
    );
    const [isLoading, setIsLoading] = useState(false);

    const handlePermissionChange = (permissionId: string) => {
        setSelectedPermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        await fetch(`/api/roles/${role.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                description,
                permissionIds: selectedPermissions
            })
        });

        setIsLoading(false);
        window.location.reload(); // Refresh halaman untuk melihat perubahan
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="name">Nama Peran</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
                <Label>Izin</Label>
                <div className="grid grid-cols-2 gap-2 border rounded-md p-2 max-h-48 overflow-y-auto">
                    {permissions.map(permission => (
                        <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`edit-${permission.id}`}
                                checked={selectedPermissions.includes(permission.id)}
                                onCheckedChange={() => handlePermissionChange(permission.id)}
                            />
                            <Label htmlFor={`edit-${permission.id}`} className="text-sm font-normal">{permission.name}</Label>
                        </div>
                    ))}
                </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
        </form>
    );
}