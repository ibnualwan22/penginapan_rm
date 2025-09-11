import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { priceHalfDay, priceFullDay } = await request.json();

    await prisma.roomType.update({
      where: { id: params.id },
      data: {
        priceHalfDay: parseFloat(priceHalfDay),
        priceFullDay: parseFloat(priceFullDay),
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}