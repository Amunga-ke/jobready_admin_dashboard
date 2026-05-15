import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const allowed = ["isActive", "autoPost", "autoPostJobTypes", "accessToken", "pageId", "pageName", "platformUsername"];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === "autoPostJobTypes" && Array.isArray(body[key])) {
          data[key] = JSON.stringify(body[key]);
        } else {
          data[key] = body[key];
        }
      }
    }

    const account = await db.socialAccount.update({
      where: { id },
      data,
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error("Social account update error:", error);
    return NextResponse.json({ error: "Failed to update social account" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await db.socialAccount.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Social account delete error:", error);
    return NextResponse.json({ error: "Failed to disconnect social account" }, { status: 500 });
  }
}
