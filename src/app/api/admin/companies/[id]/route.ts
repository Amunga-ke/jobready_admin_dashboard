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
    const company = await db.company.findUnique({
      where: { id },
      include: {
        employerProfiles: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
        teamMembers: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          include: { plan: true },
        },
        jobCredit: true,
        _count: { select: { listings: true, payments: true, featuredBoosts: true } },
      },
    });

    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    return NextResponse.json(company);
  } catch (error) {
    console.error("Company detail error:", error);
    return NextResponse.json({ error: "Failed to fetch company" }, { status: 500 });
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

    const allowed = ["name", "verified", "industry", "description", "orgType", "county", "location", "website"];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    const company = await db.company.update({ where: { id }, data });
    return NextResponse.json(company);
  } catch (error) {
    console.error("Company update error:", error);
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
  }
}
