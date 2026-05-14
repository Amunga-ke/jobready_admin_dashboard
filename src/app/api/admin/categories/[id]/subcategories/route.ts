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
    const subcategories = await db.subcategory.findMany({
      where: { categoryId: id },
      include: { _count: { select: { listings: true } } },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(subcategories);
  } catch (error) {
    console.error("Subcategories list error:", error);
    return NextResponse.json({ error: "Failed to fetch subcategories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, slug, sortOrder, active } = body;

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!slug) return NextResponse.json({ error: "Slug is required" }, { status: 400 });

    const categoryExists = await db.category.findUnique({ where: { id } });
    if (!categoryExists) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    const slugExists = await db.subcategory.findUnique({ where: { slug } });
    if (slugExists) return NextResponse.json({ error: "A subcategory with this slug already exists" }, { status: 409 });

    const subcategory = await db.subcategory.create({
      data: {
        name,
        slug,
        categoryId: id,
        sortOrder: sortOrder || 0,
        active: active !== false,
      },
    });

    return NextResponse.json(subcategory, { status: 201 });
  } catch (error) {
    console.error("Subcategory create error:", error);
    return NextResponse.json({ error: "Failed to create subcategory" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; subId?: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subId, ...data } = body;

    if (!subId) return NextResponse.json({ error: "Subcategory ID required" }, { status: 400 });

    const existing = await db.subcategory.findUnique({ where: { id: subId } });
    if (!existing) return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });

    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await db.subcategory.findUnique({ where: { slug: data.slug } });
      if (slugExists) return NextResponse.json({ error: "A subcategory with this slug already exists" }, { status: 409 });
    }

    const subcategory = await db.subcategory.update({ where: { id: subId }, data });
    return NextResponse.json(subcategory);
  } catch (error) {
    console.error("Subcategory update error:", error);
    return NextResponse.json({ error: "Failed to update subcategory" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subId = searchParams.get("subId");

    if (!subId) return NextResponse.json({ error: "Subcategory ID required" }, { status: 400 });

    await db.subcategory.delete({ where: { id: subId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subcategory delete error:", error);
    return NextResponse.json({ error: "Failed to delete subcategory" }, { status: 500 });
  }
}
