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
    const listingId = searchParams.get("listingId") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { user: { name: { contains: q } } },
        { user: { email: { contains: q } } },
        { listing: { title: { contains: q } } },
        { coverLetter: { contains: q } },
      ];
    }
    if (status) where.status = status;
    if (listingId) where.listingId = listingId;

    const [applications, total] = await Promise.all([
      db.application.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true, county: true } },
          listing: {
            select: {
              id: true,
              title: true,
              slug: true,
              employmentType: true,
              company: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        orderBy: { appliedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.application.count({ where }),
    ]);

    return NextResponse.json({
      applications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Applications list error:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}
