import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      seekers,
      employers,
      totalCompanies,
      verifiedCompanies,
      totalListings,
      activeListings,
      featuredListings,
      totalApplications,
      totalRevenue,
      monthlyRevenue,
      activeSubscriptions,
      topCompanies,
      topCategories,
      topCounties,
      recentRegistrations,
      recentListingCreations,
      subscriptionDistribution,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: "SEEKER" } }),
      db.user.count({ where: { role: "EMPLOYER" } }),
      db.company.count(),
      db.company.count({ where: { verified: true } }),
      db.listing.count(),
      db.listing.count({ where: { status: "ACTIVE" } }),
      db.listing.count({ where: { featured: true } }),
      db.application.count(),
      db.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
      db.payment.aggregate({
        where: {
          status: "COMPLETED",
          paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
        _sum: { amount: true },
      }),
      db.companySubscription.count({ where: { status: "ACTIVE" } }),
      db.company.findMany({
        take: 10,
        orderBy: { listings: { _count: "desc" } },
        select: {
          name: true,
          _count: { select: { listings: true, applications: true } },
        },
      }),
      db.category.findMany({
        take: 10,
        orderBy: { listings: { _count: "desc" } },
        select: { name: true, _count: { select: { listings: true } } },
      }),
      db.listing.groupBy({
        by: ["county"],
        where: { county: { not: "" } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      // Recent registrations - last 30 days grouped by date
      db.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT DATE(createdAt) as date, COUNT(*) as count
        FROM User
        WHERE createdAt >= ${thirtyDaysAgo}
        GROUP BY DATE(createdAt)
        ORDER BY date ASC
      `,
      // Recent listing creations - last 30 days grouped by date
      db.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT DATE(createdAt) as date, COUNT(*) as count
        FROM Listing
        WHERE createdAt >= ${thirtyDaysAgo}
        GROUP BY DATE(createdAt)
        ORDER BY date ASC
      `,
      // Subscription distribution
      db.companySubscription.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ]);

    // Get plan-based subscription distribution
    const planSubscriptions = await db.companySubscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: { select: { slug: true } } },
    });

    const planDist: Record<string, number> = { free: 0, starter: 0, pro: 0, enterprise: 0 };
    for (const sub of planSubscriptions) {
      const slug = sub.plan?.slug?.toLowerCase() || "free";
      if (slug in planDist) {
        planDist[slug]++;
      } else {
        planDist.free++;
      }
    }

    return NextResponse.json({
      totalUsers,
      seekers,
      employers,
      totalCompanies,
      verifiedCompanies,
      totalListings,
      activeListings,
      featuredListings,
      totalApplications,
      totalRevenue: totalRevenue._sum.amount || 0,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      activeSubscriptions,
      topCompanies: topCompanies.map((c) => ({
        name: c.name,
        listings: c._count.listings,
        applications: c._count.applications,
      })),
      topCategories: topCategories.map((c) => ({
        name: c.name,
        listings: c._count.listings,
      })),
      topCounties: topCounties.map((c) => ({
        name: c.county,
        listings: c._count.id,
      })),
      recentRegistrations: recentRegistrations.map((r) => ({
        date: r.date,
        count: Number(r.count),
      })),
      recentListingCreations: recentListingCreations.map((r) => ({
        date: r.date,
        count: Number(r.count),
      })),
      subscriptionDistribution: planDist,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
