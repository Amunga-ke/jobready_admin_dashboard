import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";

/**
 * GET /api/admin/skill-tests/[id]
 * Get a single test detail including all questions.
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

    const test = await db.skillTest.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: {
            results: true,
            listings: true,
          },
        },
      },
    });

    if (!test) {
      return NextResponse.json(
        { error: "Skill test not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: test.id,
      title: test.title,
      description: test.description,
      category: test.category,
      durationMinutes: test.durationMinutes,
      passingScore: test.passingScore,
      questionCount: test.questionCount,
      isActive: test.isActive,
      pricePerCandidate: test.pricePerCandidate,
      createdAt: test.createdAt.toISOString(),
      updatedAt: test.updatedAt.toISOString(),
      questions: test.questions.map((q) => ({
        id: q.id,
        question: q.question,
        questionType: q.questionType,
        options: JSON.parse(q.options),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        sortOrder: q.sortOrder,
        points: q.points,
      })),
      stats: {
        resultCount: test._count.results,
        listingCount: test._count.listings,
      },
    });
  } catch (error) {
    console.error("Admin get skill test error:", error);
    return NextResponse.json(
      { error: "Failed to fetch skill test" },
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
 * PUT /api/admin/skill-tests/[id]
 * Update a test and optionally replace its questions.
 */
export async function PUT(
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
      title?: string;
      description?: string;
      category?: string;
      durationMinutes?: number;
      passingScore?: number;
      isActive?: boolean;
      pricePerCandidate?: number;
      questions?: QuestionInput[];
    };

    // Verify test exists
    const existing = await db.skillTest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Skill test not found" },
        { status: 404 },
      );
    }

    // Validate incoming questions if provided
    if (questions && Array.isArray(questions) && questions.length > 0) {
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
      }
    }

    // Build the update data
    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (category !== undefined) data.category = category;
    if (durationMinutes !== undefined) data.durationMinutes = durationMinutes;
    if (passingScore !== undefined) data.passingScore = passingScore;
    if (isActive !== undefined) data.isActive = isActive;
    if (pricePerCandidate !== undefined) data.pricePerCandidate = pricePerCandidate;
    if (questions && Array.isArray(questions) && questions.length > 0) {
      data.questionCount = questions.length;
    }

    const updated = await db.$transaction(async (tx) => {
      const updatedTest = await tx.skillTest.update({
        where: { id },
        data,
      });

      // If questions are provided, replace all existing questions
      if (questions && Array.isArray(questions) && questions.length > 0) {
        await tx.skillTestQuestion.deleteMany({ where: { testId: id } });

        await tx.skillTestQuestion.createMany({
          data: questions.map((q, index) => ({
            testId: id,
            question: q.question.trim(),
            questionType: q.questionType || "MULTIPLE_CHOICE",
            options: JSON.stringify(q.options || []),
            correctAnswer: q.correctAnswer.trim(),
            explanation: q.explanation?.trim() || null,
            sortOrder: q.sortOrder ?? index,
            points: q.points || 1,
          })),
        });
      }

      return updatedTest;
    });

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      message: "Test updated successfully",
    });
  } catch (error) {
    console.error("Admin update skill test error:", error);
    return NextResponse.json(
      { error: "Failed to update skill test" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/skill-tests/[id]
 * Soft delete if results exist, hard delete if no results.
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

    const test = await db.skillTest.findUnique({
      where: { id },
      include: {
        _count: {
          select: { results: true },
        },
      },
    });

    if (!test) {
      return NextResponse.json(
        { error: "Skill test not found" },
        { status: 404 },
      );
    }

    if (test._count.results > 0) {
      // Soft delete — just deactivate
      await db.skillTest.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        message: "Test deactivated (has existing results)",
      });
    } else {
      // Hard delete — no results to preserve
      await db.skillTest.delete({ where: { id } });
      return NextResponse.json({
        success: true,
        message: "Test deleted permanently",
      });
    }
  } catch (error) {
    console.error("Admin delete skill test error:", error);
    return NextResponse.json(
      { error: "Failed to delete skill test" },
      { status: 500 },
    );
  }
}
