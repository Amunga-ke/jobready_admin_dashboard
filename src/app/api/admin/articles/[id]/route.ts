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
    const article = await db.article.findUnique({ where: { id } });

    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });

    return NextResponse.json(article);
  } catch (error) {
    console.error("Article detail error:", error);
    return NextResponse.json({ error: "Failed to fetch article" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await db.article.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Article not found" }, { status: 404 });

    if (body.slug && body.slug !== existing.slug) {
      const slugExists = await db.article.findUnique({ where: { slug: body.slug } });
      if (slugExists) return NextResponse.json({ error: "An article with this slug already exists" }, { status: 409 });
    }

    const article = await db.article.update({ where: { id }, data: body });
    return NextResponse.json(article);
  } catch (error) {
    console.error("Article update error:", error);
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await db.article.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Article delete error:", error);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
