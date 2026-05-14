import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 191);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const updateType = searchParams.get("updateType") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { body: { contains: q } },
      ];
    }
    if (status) where.status = status;
    if (updateType) where.updateType = updateType;

    const [updates, total] = await Promise.all([
      db.jobUpdate.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.jobUpdate.count({ where }),
    ]);

    return NextResponse.json({ updates, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Updates list error:", error);
    return NextResponse.json({ error: "Failed to fetch updates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, slug, body: updateBody, source, updateType, pdfUrl, imageUrl, listingSlug, postedBy, status } = body;

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const finalSlug = slug || slugify(title);

    const existing = await db.jobUpdate.findUnique({ where: { slug: finalSlug } });
    if (existing) return NextResponse.json({ error: "An update with this slug already exists" }, { status: 409 });

    const update = await db.jobUpdate.create({
      data: {
        title,
        slug: finalSlug,
        body: updateBody || null,
        source: source || "",
        updateType: updateType || "ANNOUNCEMENT",
        pdfUrl: pdfUrl || null,
        imageUrl: imageUrl || null,
        listingSlug: listingSlug || null,
        postedBy: postedBy || "admin",
        status: status || "DRAFT",
      },
    });

    return NextResponse.json(update, { status: 201 });
  } catch (error) {
    console.error("Update create error:", error);
    return NextResponse.json({ error: "Failed to create update" }, { status: 500 });
  }
}
