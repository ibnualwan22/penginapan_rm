'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger 
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Edit, Plus, Loader2, Gavel } from 'lucide-react';

type Item = {
  id: string;
  itemName: string;
  chargeAmount: number;
};

export default function ChargesManagementPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');

  // 1. Load Data
  const fetchItems = async () => {
    setLoading(true);
    const res = await fetch('/api/chargeable-items');
    if (res.ok) {
        setItems(await res.json());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // 2. Handle Edit / Add
  const openAdd = () => {
    setCurrentId(null);
    setFormName('');
    setFormPrice('');
    setIsModalOpen(true);
  };

  const openEdit = (item: Item) => {
    setCurrentId(item.id);
    setFormName(item.itemName);
    setFormPrice(item.chargeAmount.toString());
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
        const url = '/api/chargeable-items';
        const method = currentId ? 'PUT' : 'POST';
        const body = JSON.stringify({
            id: currentId,
            itemName: formName,
            chargeAmount: formPrice
        });

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body
        });

        if (!res.ok) throw new Error('Gagal menyimpan');
        
        setIsModalOpen(false);
        fetchItems(); // Refresh data
    } catch (error) {
        alert('Terjadi kesalahan saat menyimpan data');
    } finally {
        setIsSaving(false);
    }
  };

  // 3. Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm('Hapus item denda ini?')) return;
    
    const res = await fetch(`/api/chargeable-items?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
        fetchItems();
    } else {
        alert('Gagal menghapus. Kemungkinan item ini sudah pernah digunakan dalam transaksi.');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gavel className="w-6 h-6"/> Manajemen Denda & Sanksi
        </h1>
        <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Item Baru
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nama Item / Pelanggaran</TableHead>
                        <TableHead>Nominal Denda (Rp)</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center py-8">
                                <Loader2 className="animate-spin w-6 h-6 mx-auto"/>
                            </TableCell>
                        </TableRow>
                    ) : items.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                                Belum ada data denda.
                            </TableCell>
                        </TableRow>
                    ) : (
                        items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.itemName}</TableCell>
                                <TableCell>Rp {item.chargeAmount.toLocaleString('id-ID')}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                                        <Edit className="w-4 h-4 text-blue-600"/>
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                                        <Trash2 className="w-4 h-4 text-red-600"/>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      {/* MODAL FORM TAMBAH/EDIT */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{currentId ? 'Edit Item Denda' : 'Tambah Denda Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 py-4">
                <div>
                    <Label>Nama Item / Pelanggaran</Label>
                    <Input 
                        placeholder="Contoh: Kunci Hilang" 
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <Label>Nominal Denda (Rp)</Label>
                    <Input 
                        type="number"
                        placeholder="Contoh: 50000" 
                        value={formPrice}
                        onChange={e => setFormPrice(e.target.value)}
                        required
                    />
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? 'Menyimpan...' : 'Simpan Data'}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}