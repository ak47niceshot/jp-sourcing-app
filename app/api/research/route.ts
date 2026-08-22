import { NextRequest, NextResponse } from "next/server";
import { fetchKoreaJapanTradeSignal } from "@/lib/trade";
import { fetchJapanCandidatesByKeyword } from "@/lib/yahoo";
import { fetchJpyToKrwRate } from "@/lib/fx";

export async function POST(req: NextRequest) {
  const { keyword, hsCode } = await req.json();

  if (!keyword || typeof keyword !== "string") {
    return NextResponse.json({ error: "keyword가 필요합니다." }, { status: 400 });
  }
  if (!hsCode || typeof hsCode !== "string") {
    return NextResponse.json({ error: "hsCode가 필요합니다." }, { status: 400 });
  }

  try {
    const [tradeSignal, japanCandidates, fxRate] = await Promise.all([
      fetchKoreaJapanTradeSignal(hsCode),
      fetchJapanCandidatesByKeyword(keyword),
      fetchJpyToKrwRate(),
    ]);

    return NextResponse.json({ tradeSignal, japanCandidates, fxRate });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
