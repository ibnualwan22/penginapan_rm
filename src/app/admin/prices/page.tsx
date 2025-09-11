import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EditPriceForm from "@/components/prices/EditPriceForm";
import prisma from "@/lib/prisma";

async function getRoomTypes() {
    return prisma.roomType.findMany({ orderBy: { name: 'asc' } });
}

export default async function PricesPage() {
    const roomTypes = await getRoomTypes();

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Manajemen Tipe Kamar & Harga</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roomTypes.map(rt => (
                    <Card key={rt.id}>
                        <CardHeader>
                            <CardTitle>{rt.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <EditPriceForm roomType={rt} />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}