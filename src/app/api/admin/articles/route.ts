import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 191);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const featured = searchParams.get("featured") || "";
    const category = searchParams.get("category") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { excerpt: { contains: q } },
      ];
    }
    if (status) where.status = status;
    if (featured === "true") where.featured = true;
    if (featured === "false") where.featured = false;
    if (category) where.category = category;

    const [articles, total] = await Promise.all([
      db.article.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.article.count({ where }),
    ]);

    return NextResponse.json({ articles, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Articles list error:", error);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, slug, excerpt, body: articleBody, coverImage, category, tags, author, authorImage, status, featured, readTime } = body;

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const finalSlug = slug || slugify(title);

    const existing = await db.article.findUnique({ where: { slug: finalSlug } });
    if (existing) return NextResponse.json({ error: "An article with this slug already exists" }, { status: 409 });

    const article = await db.article.create({
      data: {
        title,
        slug: finalSlug,
        excerpt: excerpt || "",
        body: articleBody || "",
        coverImage: coverImage || null,
        category: category || "Career Tips",
        tags: tags || null,
        author: author || "JobReady Team",
        authorImage: authorImage || null,
        status: status || "DRAFT",
        featured: featured || false,
        readTime: readTime || 5,
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error("Article create error:", error);
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}
