import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Jalankan semua query secara bersamaan untuk efisiensi
    const [totalRooms, AVAILABLERooms, occupiedRooms, maintenanceRooms] = 
      await Promise.all([
        prisma.room.count(),
        prisma.room.count({ where: { status: 'AVAILABLE' } }),
        prisma.room.count({ where: { status: 'OCCUPIED' } }),
        prisma.room.count({ where: { status: 'MAINTENANCE' } }),
      ]);

    const stats = {
      totalRooms,
      AVAILABLERooms,
      occupiedRooms,
      maintenanceRooms,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}