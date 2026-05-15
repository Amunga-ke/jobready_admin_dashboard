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

    const post = await db.socialPost.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            id: true,
            platform: true,
            pageName: true,
            platformUsername: true,
            isActive: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            listingType: true,
            town: true,
            county: true,
            company: {
              select: { id: true, name: true, logo: true },
            },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Social post detail error:", error);
    return NextResponse.json({ error: "Failed to fetch social post" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await db.socialPost.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Social post delete error:", error);
    return NextResponse.json({ error: "Failed to delete social post" }, { status: 500 });
  }
}
