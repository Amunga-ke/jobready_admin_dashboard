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

    const subscription = await db.companySubscription.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true, slug: true, logo: true, industry: true, location: true } },
        plan: { select: { id: true, name: true, slug: true, description: true, priceMonthly: true, priceYearly: true, currency: true } },
        payments: {
          select: { id: true, amount: true, currency: true, status: true, paymentMethod: true, paidAt: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Subscription detail error:", error);
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
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
    const { status, extendDays } = body;

    const subscription = await db.companySubscription.findUnique({ where: { id } });
    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (status) {
      data.status = status;
      if (status === "CANCELLED") data.cancelledAt = new Date();
    }
    if (extendDays && extendDays > 0) {
      const currentEnd = new Date(subscription.currentPeriodEnd);
      currentEnd.setDate(currentEnd.getDate() + extendDays);
      data.currentPeriodEnd = currentEnd;
    }

    const updated = await db.companySubscription.update({
      where: { id },
      data,
      include: {
        company: { select: { id: true, name: true, slug: true } },
        plan: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Subscription update error:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
