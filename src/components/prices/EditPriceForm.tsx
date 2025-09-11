'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react"; // Gunakan useSession untuk cek izin di client

export default function EditPriceForm({ roomType }: { roomType: any }) {
    const router = useRouter();
    const { data: session } = useSession();
    const canUpdate = session?.user?.permissions.includes('prices:update');

    const [prices, setPrices] = useState({
        priceHalfDay: roomType.priceHalfDay,
        priceFullDay: roomType.priceFullDay,
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPrices({
            ...prices,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await fetch(`/api/room-types/${roomType.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prices),
        });
        setIsLoading(false);
        router.refresh();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor={`halfday-${roomType.id}`}>Harga Setengah Hari</Label>
                <Input
                    id={`halfday-${roomType.id}`}
                    name="priceHalfDay"
                    type="number"
                    value={prices.priceHalfDay}
                    onChange={handleChange}
                    disabled={!canUpdate || isLoading}
                />
            </div>
            <div>
                <Label htmlFor={`fullday-${roomType.id}`}>Harga Satu Hari</Label>
                <Input
                    id={`fullday-${roomType.id}`}
                    name="priceFullDay"
                    type="number"
                    value={prices.priceFullDay}
                    onChange={handleChange}
                    disabled={!canUpdate || isLoading}
                />
            </div>
            {canUpdate && (
                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Menyimpan...' : 'Simpan Harga'}
                </Button>
            )}
        </form>
    );
}