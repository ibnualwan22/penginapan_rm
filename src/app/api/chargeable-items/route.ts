import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const items = await prisma.chargeableItem.findMany({
      orderBy: {
        itemName: 'asc',
      },
    });
    return NextResponse.json(items);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}