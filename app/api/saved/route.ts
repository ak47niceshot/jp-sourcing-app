import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { TradeSignal } from "@/lib/trade";
import type { YahooItem } from "@/lib/yahoo";
import type { MarginInputs, MarginResult } from "@/lib/margin";

export async function GET() {
  const rows = await prisma.savedCandidate.findMany({
    orderBy: { createdAt: "desc" },
  });

  const items = rows.map((row) => ({
    id: row.id,
    keyword: row.keyword,
    hsCode: row.hsCode,
    tradeSignal: JSON.parse(row.tradeSignalJson) as TradeSignal,
    japanItem: JSON.parse(row.japanCandidateJson) as YahooItem,
    marginInputs: JSON.parse(row.marginInputJson) as MarginInputs,
    marginResult: JSON.parse(row.marginResultJson) as MarginResult,
    aiComment: row.aiComment,
    createdAt: row.createdAt,
  }));

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { keyword, hsCode, tradeSignal, japanItem, marginInputs, marginResult, aiComment } = body;

  if (!keyword || !hsCode || !tradeSignal || !japanItem || !marginInputs || !marginResult) {
    return NextResponse.json({ error: "필수 데이터가 누락되었습니다." }, { status: 400 });
  }

  const saved = await prisma.savedCandidate.create({
    data: {
      keyword,
      hsCode,
      tradeSignalJson: JSON.stringify(tradeSignal),
      japanCandidateJson: JSON.stringify(japanItem),
      marginInputJson: JSON.stringify(marginInputs),
      marginResultJson: JSON.stringify(marginResult),
      aiComment: aiComment ?? null,
    },
  });

  return NextResponse.json({ id: saved.id });
}
