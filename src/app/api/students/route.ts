import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Ambil parameter 'search' dari URL
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');

  if (!search) {
    return NextResponse.json({ success: false, data: [] });
  }

  // Teruskan request ke API eksternal
  const res = await fetch(`https://sigap.amtsilatipusat.com/api/student?search=${search}`);

  if (!res.ok) {
    return new NextResponse('Gagal mengambil data dari API eksternal', { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}