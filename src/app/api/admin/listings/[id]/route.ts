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
    const listing = await db.listing.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true, logo: true, county: true, industry: true } },
        category: { select: { id: true, name: true, slug: true } },
        subcategory: { select: { id: true, name: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
        _count: { select: { applications: true } },
        featuredBoosts: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

    return NextResponse.json(listing);
  } catch (error) {
    console.error("Listing detail error:", error);
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const allowed = ["status", "featured", "title"];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    const listing = await db.listing.update({ where: { id }, data });
    return NextResponse.json(listing);
  } catch (error) {
    console.error("Listing update error:", error);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await db.listing.update({ where: { id }, data: { status: "CLOSED" } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Listing delete error:", error);
    return NextResponse.json({ error: "Failed to close listing" }, { status: 500 });
  }
}
