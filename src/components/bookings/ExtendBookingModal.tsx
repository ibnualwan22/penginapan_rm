'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Clock, Loader2, Coins } from 'lucide-react';

export default function ExtendBookingModal({ booking }: { booking: any }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    
    // State Form
    const [type, setType] = useState<'FULL_DAY' | 'HALF_DAY'>('FULL_DAY');
    const [duration, setDuration] = useState(1);
    const [extraHalf, setExtraHalf] = useState(false); // Checkbox 1.5 hari
    
    const [isLoading, setIsLoading] = useState(false);

    // Helper: Hitung Estimasi Biaya
    const calculateEstimate = () => {
        if (booking.room.property.isFree || !booking.room.roomType) return 0;
        
        const priceFull = booking.room.roomType.priceFullDay || 0;
        const priceHalf = booking.room.roomType.priceHalfDay || 0;

        if (type === 'HALF_DAY') {
            return priceHalf;
        } else {
            // Full Day + Optional Half Day
            let total = priceFull * duration;
            if (extraHalf) total += priceHalf;
            return total;
        }
    };

    const estimate = calculateEstimate();
    const isFree = booking.room.property.isFree;

    const handleExtend = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/bookings/${booking.id}/extend`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    duration: type === 'FULL_DAY' ? duration : 0,
                    extraHalfDay: (type === 'FULL_DAY' && extraHalf) // Kirim status checkbox
                })
            });

            if (!res.ok) throw new Error(await res.text());
            
            setIsOpen(false);
            // Reset form
            setExtraHalf(false);
            setDuration(1);
            router.refresh(); 
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100">
                    <Clock className="w-4 h-4 mr-2" />
                    Perpanjang
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Perpanjang Durasi Menginap</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-2">
                    {/* Info Singkat */}
                    <div className="bg-gray-50 p-3 rounded-md text-sm border flex justify-between">
                        <div>
                            <p className="text-gray-500">Tamu</p>
                            <p className="font-medium">{booking.guestName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-500">Kamar</p>
                            <p className="font-medium">{booking.room.roomNumber}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1">
                            <Label className="mb-2 block">Tipe Perpanjangan</Label>
                            <Select 
                                value={type} 
                                onValueChange={(v: any) => { 
                                    setType(v); 
                                    setExtraHalf(false); // Reset checkbox kalau ganti tipe
                                }}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FULL_DAY">Harian (Full Day)</SelectItem>
                                    <SelectItem value="HALF_DAY">Setengah Hari</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {type === 'FULL_DAY' && (
                            <div className="col-span-2 md:col-span-1">
                                <Label className="mb-2 block">Jumlah Hari</Label>
                                <Input 
                                    type="number" 
                                    min={1} 
                                    value={duration} 
                                    onChange={(e) => setDuration(parseInt(e.target.value) || 1)} 
                                />
                            </div>
                        )}
                    </div>

                    {/* Checkbox Extra Half Day (Hanya jika Full Day) */}
                    {type === 'FULL_DAY' && !isFree && (
                        <div className="flex items-center space-x-2 border p-3 rounded-md border-dashed bg-blue-50/50">
                            <Checkbox 
                                id="extraHalf" 
                                checked={extraHalf}
                                onCheckedChange={(c) => setExtraHalf(c as boolean)}
                            />
                            <Label htmlFor="extraHalf" className="cursor-pointer text-sm font-normal">
                                Tambah Setengah Hari? (+ Rp {booking.room.roomType?.priceHalfDay?.toLocaleString()})
                            </Label>
                        </div>
                    )}

                    {/* Rincian Biaya */}
                    {!isFree && (
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4">
                            <h4 className="text-xs font-bold text-yellow-800 uppercase flex items-center gap-1 mb-2">
                                <Coins className="w-3 h-3" /> Rincian Biaya Tambahan
                            </h4>
                            
                            <div className="text-sm space-y-1 text-gray-700">
                                {type === 'FULL_DAY' ? (
                                    <div className="flex justify-between">
                                        <span>{duration} Hari x Rp {booking.room.roomType?.priceFullDay?.toLocaleString()}</span>
                                        <span>Rp {(booking.room.roomType?.priceFullDay * duration).toLocaleString()}</span>
                                    </div>
                                ) : (
                                    <div className="flex justify-between">
                                        <span>Paket Setengah Hari</span>
                                        <span>Rp {booking.room.roomType?.priceHalfDay?.toLocaleString()}</span>
                                    </div>
                                )}

                                {extraHalf && (
                                    <div className="flex justify-between text-green-700">
                                        <span>+ Extra Setengah Hari</span>
                                        <span>Rp {booking.room.roomType?.priceHalfDay?.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                            
                            <Separator className="my-2 bg-yellow-300" />
                            
                            <div className="flex justify-between font-bold text-lg text-yellow-900">
                                <span>Total:</span>
                                <span>Rp {estimate.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Batal</Button>
                    <Button onClick={handleExtend} disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : 'Simpan & Perpanjang'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}