import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  // 1. Cek Session
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  try {
    // 2. Ambil Room ID
    const { id } = await context.params;
    
    // 3. Baca Body (JSON)
    const body = await request.json();
    const { url, publicId } = body;

    // --- DEBUGGING LOG (Cek di Terminal VSCode Anda) ---
    console.log(">>> UPLOAD IMAGE DEBUG <<<");
    console.log("Room ID:", id);
    console.log("Body:", body);
    // --------------------------------------------------

    // 4. Validasi Manual (Agar return 400 Jelas)
    if (!id) {
        return new NextResponse('Room ID Missing', { status: 400 });
    }
    if (!url) {
        return new NextResponse('Image URL Missing from Payload', { status: 400 });
    }

    // 5. Simpan ke Database
    const newImage = await prisma.roomImage.create({
      data: {
        roomId: id,
        url: url,
        publicId: publicId || null // Pastikan tidak undefined
      }
    });

    console.log(">>> SUCCESS SAVE DB:", newImage.id);
    return NextResponse.json(newImage);

  } catch (error) {
    console.error(">>> ERROR UPLOAD IMAGE:", error);
    return new NextResponse('Gagal menyimpan gambar ke database', { status: 500 });
  }
}

// ... (Biarkan fungsi DELETE tetap sama seperti sebelumnya) ...
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get('imageId');
  const publicId = searchParams.get('publicId'); // Cloudinary ID

  // ... (Gunakan import cloudinary dari src/lib/cloudinary) ...
  // Pastikan Anda sudah import cloudinary di paling atas file ini jika belum
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
  });

  if (!imageId) return new NextResponse('Image ID required', { status: 400 });

  try {
    // 1. Hapus dari Cloudinary (Jika ada publicId)
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }

    // 2. Hapus dari Database
    await prisma.roomImage.delete({
      where: { id: imageId }
    });

    return NextResponse.json({ message: 'Gambar berhasil dihapus' });
  } catch (error) {
    console.error(error);
    return new NextResponse('Gagal menghapus gambar', { status: 500 });
  }
}