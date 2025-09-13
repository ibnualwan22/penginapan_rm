import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(properties);
  } catch (error) {
    console.error("Public Properties API Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}