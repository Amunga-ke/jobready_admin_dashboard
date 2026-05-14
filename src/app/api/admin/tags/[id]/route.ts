import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await db.tag.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tag delete error:", error);
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
  }
}
