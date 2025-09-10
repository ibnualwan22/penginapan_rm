'use client';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DeleteUserButton({ userId }: { userId: string }) {
    const router = useRouter();
    const handleDelete = async () => {
        if (confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
            await fetch(`/api/users/${userId}`, { method: 'DELETE' });
            router.refresh();
        }
    };
    return <Button variant="destructive" size="sm" onClick={handleDelete}>Hapus</Button>;
}