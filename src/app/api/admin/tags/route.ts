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

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (q) where.name = { contains: q };

    const [tags, total] = await Promise.all([
      db.tag.findMany({
        where,
        include: { _count: { select: { listings: true } } },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.tag.count({ where }),
    ]);

    return NextResponse.json({ tags, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Tags list error:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || !name.trim()) return NextResponse.json({ error: "Tag name is required" }, { status: 400 });

    const existing = await db.tag.findUnique({ where: { name: name.trim() } });
    if (existing) return NextResponse.json({ error: "This tag already exists" }, { status: 409 });

    const tag = await db.tag.create({
      data: { name: name.trim() },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("Tag create error:", error);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}
