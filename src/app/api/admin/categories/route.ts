import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await db.category.findMany({
      include: {
        _count: { select: { subcategories: true, listings: true } },
        subcategories: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Categories list error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, slug, icon, sortOrder, active } = body;

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!slug) return NextResponse.json({ error: "Slug is required" }, { status: 400 });

    const existing = await db.category.findUnique({ where: { slug } });
    if (existing) return NextResponse.json({ error: "A category with this slug already exists" }, { status: 409 });

    const category = await db.category.create({
      data: {
        name,
        slug,
        icon: icon || null,
        sortOrder: sortOrder || 0,
        active: active !== false,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Category create error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
