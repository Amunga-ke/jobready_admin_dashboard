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

    const plans = await db.subscriptionPlan.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: {
            subscriptions: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Plans list error:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name, slug, description, priceMonthly, priceYearly, currency,
      maxListings, maxFeatured, maxCvSearches, maxTeamMembers,
      maxMessagesPerDay, features, isActive, sortOrder,
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    const existing = await db.subscriptionPlan.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Plan with this name or slug already exists" }, { status: 409 });
    }

    const plan = await db.subscriptionPlan.create({
      data: {
        name,
        slug,
        description: description || null,
        priceMonthly: priceMonthly ?? 0,
        priceYearly: priceYearly ?? 0,
        currency: currency || "KES",
        maxListings: maxListings ?? 3,
        maxFeatured: maxFeatured ?? 0,
        maxCvSearches: maxCvSearches ?? 0,
        maxTeamMembers: maxTeamMembers ?? 1,
        maxMessagesPerDay: maxMessagesPerDay ?? 10,
        features: features || "[]",
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Plan create error:", error);
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  }
}
