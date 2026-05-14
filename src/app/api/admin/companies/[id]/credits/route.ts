import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { amount, description } = body;

    if (!amount || amount === 0) {
      return NextResponse.json({ error: "Amount is required and must be non-zero" }, { status: 400 });
    }
    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const company = await db.company.findUnique({ where: { id }, include: { jobCredit: true } });
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Upsert credit record
    const credit = company.jobCredit || await db.jobCredit.create({
      data: { companyId: id },
    });

    const newBalance = credit.balance + amount;

    if (newBalance < 0) {
      return NextResponse.json({ error: "Balance cannot go negative" }, { status: 400 });
    }

    await db.$transaction([
      db.jobCredit.update({
        where: { companyId: id },
        data: {
          balance: newBalance,
          totalPurchased: amount > 0 ? { increment: amount } : undefined,
          totalUsed: amount < 0 ? { increment: Math.abs(amount) } : undefined,
        },
      }),
      db.jobCreditTransaction.create({
        data: {
          creditId: credit.id,
          type: "ADMIN_ADJUST",
          amount,
          balanceAfter: newBalance,
          description: `Admin: ${description}`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, newBalance });
  } catch (error) {
    console.error("Credit adjustment error:", error);
    return NextResponse.json({ error: "Failed to adjust credits" }, { status: 500 });
  }
}
