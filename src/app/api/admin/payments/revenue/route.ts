import { NextResponse } from "next/server";
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
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalRev,
      thisMonthRev,
      thisWeekRev,
      todayRev,
      completedCount,
      pendingCount,
      failedCount,
      subRev,
      creditsRev,
      boostRev,
    ] = await Promise.all([
      db.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
      db.payment.aggregate({ where: { status: "COMPLETED", paidAt: { gte: monthStart } }, _sum: { amount: true } }),
      db.payment.aggregate({ where: { status: "COMPLETED", paidAt: { gte: weekStart } }, _sum: { amount: true } }),
      db.payment.aggregate({ where: { status: "COMPLETED", paidAt: { gte: todayStart } }, _sum: { amount: true } }),
      db.payment.count({ where: { status: "COMPLETED" } }),
      db.payment.count({ where: { status: "PENDING" } }),
      db.payment.count({ where: { status: "FAILED" } }),
      db.payment.aggregate({ where: { status: "COMPLETED", itemType: "SUBSCRIPTION" }, _sum: { amount: true } }),
      db.payment.aggregate({ where: { status: "COMPLETED", itemType: "CREDITS" }, _sum: { amount: true } }),
      db.payment.aggregate({ where: { status: "COMPLETED", itemType: "FEATURED_BOOST" }, _sum: { amount: true } }),
    ]);

    return NextResponse.json({
      totalRevenue: totalRev._sum.amount || 0,
      thisMonthRevenue: thisMonthRev._sum.amount || 0,
      thisWeekRevenue: thisWeekRev._sum.amount || 0,
      todayRevenue: todayRev._sum.amount || 0,
      completedPayments: completedCount,
      pendingPayments: pendingCount,
      failedPayments: failedCount,
      byType: {
        SUBSCRIPTION: subRev._sum.amount || 0,
        CREDITS: creditsRev._sum.amount || 0,
        FEATURED_BOOST: boostRev._sum.amount || 0,
      },
    });
  } catch (error) {
    console.error("Revenue stats error:", error);
    return NextResponse.json({ error: "Failed to fetch revenue data" }, { status: 500 });
  }
}
