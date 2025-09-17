// src/app/api/roles/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PATCH /api/roles/[id] - update role + relasi permissions
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roleId } = await context.params;

    const json = await req.json().catch(() => ({}));
    const {
      name,
      description,
      permissionIds,
    }: { name?: string; description?: string; permissionIds?: string[] } = json;

    if (!roleId) {
      return NextResponse.json({ message: "Missing roleId" }, { status: 400 });
    }

    // Opsional: validasi minimal
    if (typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ message: "Nama peran wajib diisi" }, { status: 400 });
    }

    const ids = Array.isArray(permissionIds)
      ? Array.from(new Set(permissionIds.filter(Boolean)))
      : [];

    await prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id: roleId },
        data: { name, description },
      });

      await tx.rolePermission.deleteMany({ where: { roleId } });

      if (ids.length > 0) {
        await tx.rolePermission.createMany({
          data: ids.map((pid) => ({ roleId, permissionId: pid })),
          skipDuplicates: true,
        });
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("PATCH /api/roles/[id] error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE /api/roles/[id] - hapus role jika tidak dipakai user
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ message: "Missing roleId" }, { status: 400 });
    }

    const usersInRole = await prisma.user.count({ where: { roleId: id } });
    if (usersInRole > 0) {
      return new NextResponse(
        `Tidak bisa menghapus, masih ada ${usersInRole} pengguna dalam peran ini.`,
        { status: 409 }
      );
    }

    await prisma.role.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("DELETE /api/roles/[id] error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
