import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const imageId = params.id;
  
  // Ambil URL gambar dari database
  const image = await prisma.roomImage.findUnique({ where: { id: imageId } });
  
  if (image) {
    // Hapus dari Vercel Blob
    await del(image.url);
    // Hapus dari database kita
    await prisma.roomImage.delete({ where: { id: imageId } });
  }

  return new NextResponse(null, { status: 204 });
}