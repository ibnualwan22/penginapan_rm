import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const roomTypes = await prisma.roomType.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(roomTypes);
  } catch (error) {
    console.error("Get Room Types Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}