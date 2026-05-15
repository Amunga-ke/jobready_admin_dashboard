import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";

/**
 * GET /api/admin/skill-tests/results?testId=&listingId=&passed=&page=&limit=
 * View all test results across all candidates.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const testId = searchParams.get("testId") || "";
    const listingId = searchParams.get("listingId") || "";
    const passed = searchParams.get("passed") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {
      status: "COMPLETED",
    };

    if (testId) where.testId = testId;
    if (listingId) where.listingId = listingId;
    if (passed === "true") where.passed = true;
    else if (passed === "false") where.passed = false;

    const [results, total] = await Promise.all([
      db.skillTestResult.findMany({
        where,
        include: {
          test: {
            select: {
              id: true,
              title: true,
              category: true,
              passingScore: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { completedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.skillTestResult.count({ where }),
    ]);

    return NextResponse.json({
      results: results.map((r) => ({
        id: r.id,
        candidate: {
          id: r.user.id,
          name: r.user.name || r.user.email,
          email: r.user.email,
        },
        test: {
          id: r.test.id,
          title: r.test.title,
          category: r.test.category,
          passingScore: r.test.passingScore,
        },
        listing: r.listing
          ? { id: r.listing.id, title: r.listing.title }
          : null,
        score: r.score,
        totalPoints: r.totalPoints,
        maxPoints: r.maxPoints,
        passed: r.passed,
        timeTakenSeconds: r.timeTakenSeconds,
        completedAt: r.completedAt?.toISOString(),
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin test results error:", error);
    return NextResponse.json(
      { error: "Failed to fetch test results" },
      { status: 500 },
    );
  }
}
