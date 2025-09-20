// src/app/api/rooms/[id]/upload/route.ts
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Akses ditolak', { status: 401 });

  const { id: roomId } = await params;

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  if (!filename || !request.body) {
    return new NextResponse('Nama file tidak ditemukan', { status: 400 });
  }

  const contentType = request.headers.get('content-type') || undefined;

  // nama unik
  const safe = filename.replace(/[^\w.\-]/g, '_');
  const key = `${roomId}/${Date.now()}-${safe}`;

  // ⬇️ tambahkan token (atau cukup rely ke env var tanpa pass di sini—keduanya oke)
  const blob = await put(key, request.body, {
    access: 'public',
    addRandomSuffix: false,
    contentType,
    token: process.env.BLOB_READ_WRITE_TOKEN, // ⬅️ penting
  });

  await prisma.roomImage.create({
    data: {
      roomId,
      url: blob.url,
      // hapus field yang tak ada di schema (mis. filename/mimeType) atau tambahkan dulu di Prisma schema
    },
  });

  return NextResponse.json({ url: blob.url });
}
