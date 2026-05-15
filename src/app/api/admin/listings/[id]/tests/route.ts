import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";

/**
 * GET /api/admin/listings/[id]/tests
 * Get all tests attached to a listing.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify the listing exists
    const listing = await db.listing.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 },
      );
    }

    const listingTests = await db.listingTest.findMany({
      where: { listingId: id },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            category: true,
            durationMinutes: true,
            questionCount: true,
            passingScore: true,
            isActive: true,
            _count: { select: { results: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      listing: { id: listing.id, title: listing.title },
      tests: listingTests.map((lt) => ({
        id: lt.id,
        testId: lt.test.id,
        title: lt.test.title,
        category: lt.test.category,
        duration: lt.test.durationMinutes,
        questionCount: lt.test.questionCount,
        passingScore: lt.test.passingScore,
        isActive: lt.test.isActive,
        isRequired: lt.isRequired,
        minScore: lt.minScore,
        totalResults: lt.test._count.results,
        attachedAt: lt.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Admin get listing tests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch listing tests" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/listings/[id]/tests
 * Attach a test to a listing.
 * Body: { testId, isRequired, minScore }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { testId, isRequired, minScore } = body as {
      testId: string;
      isRequired?: boolean;
      minScore?: number;
    };

    if (!testId) {
      return NextResponse.json(
        { error: "testId is required" },
        { status: 400 },
      );
    }

    // Verify listing exists
    const listing = await db.listing.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 },
      );
    }

    // Verify test exists
    const test = await db.skillTest.findUnique({
      where: { id: testId },
      select: { id: true, title: true },
    });
    if (!test) {
      return NextResponse.json(
        { error: "Skill test not found" },
        { status: 404 },
      );
    }

    // Attach test to listing
    const listingTest = await db.listingTest.create({
      data: {
        listingId: id,
        testId,
        isRequired: isRequired !== false,
        minScore: minScore || 60,
      },
    });

    return NextResponse.json(
      {
        id: listingTest.id,
        listingId: id,
        testId,
        testTitle: test.title,
        isRequired: listingTest.isRequired,
        minScore: listingTest.minScore,
        message: "Test attached to listing successfully",
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") {
      return NextResponse.json(
        { error: "This test is already attached to this listing" },
        { status: 409 },
      );
    }
    console.error("Admin attach listing test error:", error);
    return NextResponse.json(
      { error: "Failed to attach test to listing" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/listings/[id]/tests?testId=xxx
 * Remove a test from a listing.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const testId = searchParams.get("testId");

    if (!testId) {
      return NextResponse.json(
        { error: "testId query parameter is required" },
        { status: 400 },
      );
    }

    const listingTest = await db.listingTest.findUnique({
      where: {
        listingId_testId: { listingId: id, testId },
      },
    });

    if (!listingTest) {
      return NextResponse.json(
        { error: "Test is not attached to this listing" },
        { status: 404 },
      );
    }

    await db.listingTest.delete({
      where: {
        listingId_testId: { listingId: id, testId },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Test removed from listing",
    });
  } catch (error) {
    console.error("Admin remove listing test error:", error);
    return NextResponse.json(
      { error: "Failed to remove test from listing" },
      { status: 500 },
    );
  }
}
