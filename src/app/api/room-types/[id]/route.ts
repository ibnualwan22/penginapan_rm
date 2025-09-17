import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { priceHalfDay, priceFullDay } = await req.json();

    await prisma.roomType.update({
      where: { id },
      data: {
        priceHalfDay: parseFloat(priceHalfDay),
        priceFullDay: parseFloat(priceFullDay),
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("PATCH /api/room-types/[id] error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
