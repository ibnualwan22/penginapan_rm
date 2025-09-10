import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(permissions);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}