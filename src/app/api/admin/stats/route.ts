import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalSeekers,
      totalEmployers,
      totalCompanies,
      totalListings,
      activeListings,
      totalApplications,
      totalPayments,
      monthlyPayments,
      activeSubscriptions,
      featuredListings,
      recentUsers,
      recentListings,
      recentPayments,
    ] = await Promise.all([
      db.user.count({ where: { isActive: true } }),
      db.user.count({ where: { role: "SEEKER", isActive: true } }),
      db.user.count({ where: { role: "EMPLOYER", isActive: true } }),
      db.company.count(),
      db.listing.count(),
      db.listing.count({ where: { status: "ACTIVE" } }),
      db.application.count(),
      db.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
      db.payment.aggregate({ where: { status: "COMPLETED", paidAt: { gte: monthStart } }, _sum: { amount: true } }),
      db.companySubscription.count({ where: { status: "ACTIVE" } }),
      db.listing.count({ where: { featured: true, status: "ACTIVE" } }),
      db.user.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, role: true, county: true, isActive: true, createdAt: true } }),
      db.listing.findMany({ take: 10, orderBy: { createdAt: "desc" }, select: { id: true, title: true, status: true, company: { select: { name: true } }, createdAt: true } }),
      db.payment.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, amount: true, currency: true, status: true, paymentMethod: true, company: { select: { name: true } }, createdAt: true } }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalSeekers,
      totalEmployers,
      totalCompanies,
      totalListings,
      activeListings,
      totalApplications,
      totalRevenue: totalPayments._sum?.amount || 0,
      monthlyRevenue: monthlyPayments._sum?.amount || 0,
      activeSubscriptions,
      featuredListings,
      recentUsers,
      recentListings,
      recentPayments,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
