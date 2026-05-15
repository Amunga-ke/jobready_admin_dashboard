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
    const status = searchParams.get("status") || "";
    const listingId = searchParams.get("listingId") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (platform) where.platform = platform;
    if (status) where.status = status;
    if (listingId) where.listingId = listingId;

    const [posts, total] = await Promise.all([
      db.socialPost.findMany({
        where,
        select: {
          id: true,
          platform: true,
          platformPostId: true,
          platformUrl: true,
          caption: true,
          posterUrl: true,
          status: true,
          postType: true,
          errorMessage: true,
          postedAt: true,
          createdAt: true,
          accountId: true,
          listingId: true,
          account: {
            select: {
              id: true,
              platform: true,
              pageName: true,
              platformUsername: true,
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
              slug: true,
              listingType: true,
              company: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.socialPost.count({ where }),
    ]);

    return NextResponse.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Social posts list error:", error);
    return NextResponse.json({ error: "Failed to fetch social posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { listingId, accountIds, caption, posterUrl, posterTemplate } = body;

    if (!listingId || !accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json({ error: "Listing ID and at least one account are required" }, { status: 400 });
    }

    const listing = await db.listing.findUnique({
      where: { id: listingId },
      select: { id: true, title: true, description: true, listingType: true, town: true, county: true, employmentType: true, company: { select: { name: true, logo: true } } },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Generate default caption if not provided
    const defaultCaption = `${listing.company?.name || ""} is hiring: ${listing.title}\n\n📍 ${[listing.town, listing.county].filter(Boolean).join(", ")}\n💼 ${listing.employmentType}\n\nApply now on JobReady! #JobsInKenya #JobReady`;

    const finalCaption = caption || defaultCaption;

    // Create post records for each selected account
    const posts = await Promise.all(
      accountIds.map(async (accountId: string) => {
        return db.socialPost.create({
          data: {
            accountId,
            listingId,
            platform: "", // Will be set from account
            caption: finalCaption,
            posterUrl: posterUrl || null,
            status: "PENDING",
            postType: "JOB_POSTER",
            metadata: posterTemplate ? JSON.stringify({ template: posterTemplate }) : null,
          },
        });
      })
    );

    // Update platform from account data
    const updatedPosts = await Promise.all(
      posts.map(async (post) => {
        const account = await db.socialAccount.findUnique({
          where: { id: post.accountId },
          select: { platform: true },
        });
        if (account) {
          return db.socialPost.update({
            where: { id: post.id },
            data: { platform: account.platform },
          });
        }
        return post;
      })
    );

    return NextResponse.json({ posts: updatedPosts, message: `Created ${updatedPosts.length} post(s)` }, { status: 201 });
  } catch (error) {
    console.error("Social post create error:", error);
    return NextResponse.json({ error: "Failed to create social posts" }, { status: 500 });
  }
}
