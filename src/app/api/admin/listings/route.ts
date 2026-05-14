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
    const status = searchParams.get("status") || "";
    const featured = searchParams.get("featured") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const county = searchParams.get("county") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
      ];
    }
    if (status) where.status = status;
    if (featured === "true") where.featured = true;
    if (featured === "false") where.featured = false;
    if (categoryId) where.categoryId = categoryId;
    if (county) where.county = county;

    const [listings, total] = await Promise.all([
      db.listing.findMany({
        where,
        select: {
          id: true,
          title: true,
          status: true,
          featured: true,
          employmentType: true,
          workMode: true,
          county: true,
          createdAt: true,
          deadline: true,
          viewCount: true,
          applyCount: true,
          company: { select: { id: true, name: true, logo: true } },
          category: { select: { id: true, name: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.listing.count({ where }),
    ]);

    return NextResponse.json({ listings, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Listings list error:", error);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}
