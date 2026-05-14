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
    const verified = searchParams.get("verified") || "";
    const industry = searchParams.get("industry") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { slug: { contains: q } },
      ];
    }
    if (verified === "true") where.verified = true;
    if (verified === "false") where.verified = false;
    if (industry) where.industry = industry;

    const [companies, total] = await Promise.all([
      db.company.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          verified: true,
          orgType: true,
          industry: true,
          county: true,
          location: true,
          country: true,
          createdAt: true,
          _count: { select: { listings: true, teamMembers: true } },
          subscriptions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { plan: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.company.count({ where }),
    ]);

    return NextResponse.json({ companies, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Companies list error:", error);
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
  }
}
