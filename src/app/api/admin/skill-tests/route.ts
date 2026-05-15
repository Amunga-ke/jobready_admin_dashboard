import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";

/**
 * GET /api/admin/skill-tests?search=&category=&page=&limit=
 * List all skill tests with pagination, search, and category filter.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (category) {
      where.category = category;
    }

    const [tests, total] = await Promise.all([
      db.skillTest.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          durationMinutes: true,
          passingScore: true,
          questionCount: true,
          isActive: true,
          pricePerCandidate: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              questions: true,
              results: true,
              listings: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.skillTest.count({ where }),
    ]);

    // Calculate average scores for each test
    const testIds = tests.map((t) => t.id);
    const avgScores = await db.skillTestResult.groupBy({
      by: ["testId"],
      where: {
        testId: { in: testIds },
        status: "COMPLETED",
      },
      _avg: { score: true },
    });

    const avgScoreMap = new Map(
      avgScores.map((a) => [a.testId, Math.round((a._avg.score || 0))]),
    );

    const result = tests.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      durationMinutes: t.durationMinutes,
      passingScore: t.passingScore,
      questionCount: t.questionCount,
      isActive: t.isActive,
      pricePerCandidate: t.pricePerCandidate,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      stats: {
        questionCount: t._count.questions,
        resultCount: t._count.results,
        listingCount: t._count.listings,
        avgScore: avgScoreMap.get(t.id) || 0,
      },
    }));

    return NextResponse.json({
      tests: result,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin list skill tests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch skill tests" },
      { status: 500 },
    );
  }
}

interface QuestionInput {
  question: string;
  questionType: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  points?: number;
  sortOrder?: number;
}

/**
 * POST /api/admin/skill-tests
 * Creates a new skill test with all questions in one transaction.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      category,
      durationMinutes,
      passingScore,
      isActive,
      pricePerCandidate,
      questions,
    } = body as {
      title: string;
      description?: string;
      category?: string;
      durationMinutes?: number;
      passingScore?: number;
      isActive?: boolean;
      pricePerCandidate?: number;
      questions: QuestionInput[];
    };

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 },
      );
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "At least one question is required" },
        { status: 400 },
      );
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question?.trim()) {
        return NextResponse.json(
          { error: `Question ${i + 1} is missing question text` },
          { status: 400 },
        );
      }
      if (!q.correctAnswer?.trim()) {
        return NextResponse.json(
          { error: `Question ${i + 1} is missing correctAnswer` },
          { status: 400 },
        );
      }
      if (
        q.questionType === "MULTIPLE_CHOICE" &&
        (!q.options || !Array.isArray(q.options) || q.options.length < 2)
      ) {
        return NextResponse.json(
          { error: `Question ${i + 1} needs at least 2 options` },
          { status: 400 },
        );
      }
    }

    // Create test with questions in a transaction
    const test = await db.$transaction(async (tx) => {
      const createdTest = await tx.skillTest.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          category: category || "GENERAL",
          durationMinutes: durationMinutes || 15,
          passingScore: passingScore || 60,
          questionCount: questions.length,
          isActive: isActive !== false,
          pricePerCandidate: pricePerCandidate || 50,
        },
      });

      await tx.skillTestQuestion.createMany({
        data: questions.map((q, index) => ({
          testId: createdTest.id,
          question: q.question.trim(),
          questionType: q.questionType || "MULTIPLE_CHOICE",
          options: JSON.stringify(q.options || []),
          correctAnswer: q.correctAnswer.trim(),
          explanation: q.explanation?.trim() || null,
          sortOrder: q.sortOrder ?? index,
          points: q.points || 1,
        })),
      });

      return createdTest;
    });

    return NextResponse.json(
      { id: test.id, title: test.title, questionCount: test.questionCount },
      { status: 201 },
    );
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") {
      return NextResponse.json(
        { error: "A test with similar data already exists" },
        { status: 409 },
      );
    }
    console.error("Admin create skill test error:", error);
    return NextResponse.json(
      { error: "Failed to create skill test" },
      { status: 500 },
    );
  }
}
