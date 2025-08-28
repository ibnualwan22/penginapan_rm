import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
    return NextResponse.json({ query: '', results: [] });
  }

  const res = await fetch(`https://backapp.amtsilatipusat.com/api/regencies?name=${name}`);

  if (!res.ok) {
    return new NextResponse('Gagal mengambil data dari API eksternal', { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}