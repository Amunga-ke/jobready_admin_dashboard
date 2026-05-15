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
    const platform = searchParams.get("platform") || "";
    const active = searchParams.get("active") || "";

    const where: Record<string, unknown> = {};
    if (platform) where.platform = platform;
    if (active === "true") where.isActive = true;
    if (active === "false") where.isActive = false;

    const accounts = await db.socialAccount.findMany({
      where,
      select: {
        id: true,
        platform: true,
        platformUserId: true,
        platformUsername: true,
        pageId: true,
        pageName: true,
        isActive: true,
        autoPost: true,
        autoPostJobTypes: true,
        lastPostedAt: true,
        createdAt: true,
        updatedAt: true,
        companyId: true,
        company: {
          select: { id: true, name: true, logo: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        _count: { select: { socialPosts: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Social accounts list error:", error);
    return NextResponse.json({ error: "Failed to fetch social accounts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { platform, accessToken, pageId, pageName, platformUsername, companyId, autoPost, autoPostJobTypes, isActive } = body;

    if (!platform) {
      return NextResponse.json({ error: "Platform is required" }, { status: 400 });
    }

    const userId = (session.user as { id?: string }).id;

    const account = await db.socialAccount.create({
      data: {
        userId: userId || "",
        platform,
        accessToken: accessToken || null,
        pageId: pageId || null,
        pageName: pageName || null,
        platformUsername: platformUsername || null,
        companyId: companyId || null,
        autoPost: autoPost ?? false,
        autoPostJobTypes: autoPostJobTypes ? JSON.stringify(autoPostJobTypes) : null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error: unknown) {
    console.error("Social account create error:", error);
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") {
      return NextResponse.json({ error: "This platform account is already connected" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create social account" }, { status: 500 });
  }
}
