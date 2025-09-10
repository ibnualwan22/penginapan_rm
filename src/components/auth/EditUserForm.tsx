'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Role } from "@prisma/client";

export default function EditUserForm({ user, roles }: { user: any, roles: Role[] }) {
    const router = useRouter();
    const [name, setName] = useState(user.name);
    const [username, setUsername] = useState(user.username);
    const [password, setPassword] = useState(''); // State untuk password baru
    const [roleId, setRoleId] = useState(user.roleId);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const res = await fetch(`/api/users/${user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            // Kirim password baru (bisa kosong)
            body: JSON.stringify({ name, username, password, roleId })
        });

        if (!res.ok) {
            const body = await res.json();
            setError(body.message || 'Gagal memperbarui pengguna');
        } else {
            window.location.reload(); 
        }

        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div>
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            {/* --- INPUT BARU UNTUK PASSWORD --- */}
            <div>
                <Label htmlFor="password">Password Baru (Opsional)</Label>
                <Input 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Kosongkan jika tidak diubah"
                />
            </div>
            <div>
                <Label htmlFor="role">Peran (Role)</Label>
                <Select value={roleId} onValueChange={setRoleId} required>
                    <SelectTrigger><SelectValue placeholder="Pilih peran..." /></SelectTrigger>
                    <SelectContent>
                        {roles.map(role => (
                            <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
        </form>
    );
}
