// src/app/api/images/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
// (opsional) hapus file di Vercel Blob juga:
import { del } from '@vercel/blob';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ← Wajib Promise
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse('Akses ditolak', { status: 401 });
  }

  const { id } = await params; // ← Wajib di-await

  // Ambil image + room untuk otorisasi
  const img = await prisma.roomImage.findUnique({
    where: { id },
    include: { room: { select: { propertyId: true } } },
  });
  if (!img) return new NextResponse('Gambar tidak ditemukan', { status: 404 });

  // Cek apakah user mengelola properti terkait (jika kamu simpan ini di session)
  const managed = (session.user.managedProperties || []).map((p: any) => p.id);
  if (!managed.includes(img.room.propertyId)) {
    return new NextResponse('Akses ke properti ini ditolak', { status: 403 });
  }

  // (opsional) hapus dari Vercel Blob
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await del(img.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    }
  } catch {
    // abaikan kegagalan hapus blob supaya tetap hapus record DB
  }

  await prisma.roomImage.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
