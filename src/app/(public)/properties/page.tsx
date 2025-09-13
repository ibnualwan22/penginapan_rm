'use client';

import { useState, useEffect } from 'react';
import CompactRoomCard from '@/components/public/CompactRoomCard';
import prisma from '@/lib/prisma'; // Impor ini jika belum ada
import { Property } from '@prisma/client'; // Impor tipe

// Helper untuk mengambil data properti di client
async function getProperties(): Promise<Property[]> {
    const res = await fetch('/api/public/properties'); // Kita perlu buat API ini
    return res.json();
}

export default function PropertiesPage() {
    const [rooms, setRooms] = useState([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [selectedProperty, setSelectedProperty] = useState('all');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Ambil daftar properti untuk filter
        const fetchProperties = async () => {
            const res = await fetch('/api/public/properties'); // API baru
            if (res.ok) {
                setProperties(await res.json());
            }
        };
        fetchProperties();
    }, []);

    useEffect(() => {
        // Ambil data kamar berdasarkan filter
        const fetchRooms = async () => {
            setIsLoading(true);
            let url = '/api/public/all-rooms';
            if (selectedProperty !== 'all') {
                url += `?propertyId=${selectedProperty}`;
            }
            const res = await fetch(url);
            if (res.ok) {
                setRooms(await res.json());
            }
            setIsLoading(false);
        };
        fetchRooms();
    }, [selectedProperty]);

    return (
        <div className="pt-nav">
        <div className="section">
            <div className="container">
                <div className="row mb-5 align-items-center">
                    <div className="col-lg-6">
                        <h2 className="font-weight-bold text-primary heading">Daftar Semua Kamar</h2>
                    </div>
                    <div className="col-lg-6 text-lg-end">
                        {/* Filter Dropdown */}
                        <select 
                            className="form-control" 
                            style={{ maxWidth: '200px', display: 'inline-block' }}
                            value={selectedProperty}
                            onChange={(e) => setSelectedProperty(e.target.value)}
                        >
                            <option value="all">Penginapan RJ & RM</option>
                            {properties.map(prop => (
                                <option key={prop.id} value={prop.id}>{prop.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <p>Memuat kamar...</p>
                    ) : (
                        rooms.map((room: any) => (
                            <CompactRoomCard key={room.id} room={room} />
                        ))
                    )}
                </div>
            </div>
        </div>
        </div>
    );
}