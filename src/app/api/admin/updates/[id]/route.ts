import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const update = await db.jobUpdate.findUnique({ where: { id } });

    if (!update) return NextResponse.json({ error: "Update not found" }, { status: 404 });

    return NextResponse.json(update);
  } catch (error) {
    console.error("Update detail error:", error);
    return NextResponse.json({ error: "Failed to fetch update" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await db.jobUpdate.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Update not found" }, { status: 404 });

    if (body.slug && body.slug !== existing.slug) {
      const slugExists = await db.jobUpdate.findUnique({ where: { slug: body.slug } });
      if (slugExists) return NextResponse.json({ error: "An update with this slug already exists" }, { status: 409 });
    }

    const allowed = ["title", "slug", "body", "source", "updateType", "pdfUrl", "imageUrl", "listingSlug", "postedBy", "status"];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    const update = await db.jobUpdate.update({ where: { id }, data });
    return NextResponse.json(update);
  } catch (error) {
    console.error("Update update error:", error);
    return NextResponse.json({ error: "Failed to update update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await db.jobUpdate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update delete error:", error);
    return NextResponse.json({ error: "Failed to delete update" }, { status: 500 });
  }
}
