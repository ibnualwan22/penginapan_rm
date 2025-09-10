'use client';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DeleteRoleButton({ roleId }: { roleId: string }) {
    const router = useRouter();
    const handleDelete = async () => {
        if (confirm('Apakah Anda yakin ingin menghapus peran ini? Peran tidak bisa dihapus jika masih digunakan oleh pengguna.')) {
            const res = await fetch(`/api/roles/${roleId}`, { method: 'DELETE' });
            if (res.ok) {
                router.refresh();
            } else {
                const message = await res.text();
                alert(`Gagal menghapus: ${message}`);
            }
        }
    };
    return <Button variant="destructive" onClick={handleDelete} className="w-full">Hapus</Button>;
}