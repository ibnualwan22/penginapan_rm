import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET /api/rooms/[id]
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> } // ← params adalah Promise
) {
  const { id } = await context.params;
  try {
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        property: {
          select: { id: true, name: true, isFree: true }, // ← penting: isFree
        },
        // Tambahkan relasi lain jika perlu:
        // roomType: { select: { id: true, name: true } },
      },
    });

    if (!room) {
      return new NextResponse('Kamar tidak ditemukan', { status: 404 });
    }
    return NextResponse.json(room);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PATCH /api/rooms/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return new NextResponse('Akses ditolak', { status: 401 });
  }

  // Pastikan tipe session.user.managedProperties[] sudah di-extend di next-auth.d.ts
  const managedPropertyIds = (session.user.managedProperties || []).map((p: any) => p.id);

  try {
    const { id } = params;
    const { roomNumber, floor, roomTypeId, status } = await request.json();

    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) return new NextResponse('Kamar tidak ditemukan', { status: 404 });

    // Authorization: hanya properti yang dikelola user
    if (!managedPropertyIds.includes(room.propertyId)) {
      return new NextResponse('Akses ke properti ini ditolak', { status: 403 });
    }

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: {
        roomNumber,
        floor: floor != null ? parseInt(String(floor), 10) : undefined,
        status,
        ...(roomTypeId ? { roomType: { connect: { id: roomTypeId } } } : {}),
      },
      include: {
        property: { select: { id: true, name: true, isFree: true } }, // konsisten
      },
    });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE /api/rooms/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return new NextResponse('Akses ditolak', { status: 401 });
  }
  const managedPropertyIds = (session.user.managedProperties || []).map((p: any) => p.id);

  try {
    const { id } = params;

    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) return new NextResponse('Kamar tidak ditemukan', { status: 404 });

    if (!managedPropertyIds.includes(room.propertyId)) {
      return new NextResponse('Akses ke properti ini ditolak', { status: 403 });
    }

    await prisma.room.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
