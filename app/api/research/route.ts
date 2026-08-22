import { NextRequest, NextResponse } from "next/server";
import { fetchKoreaJapanTradeSignal } from "@/lib/trade";
import { fetchJpyToKrwRate } from "@/lib/fx";

/**
 * 일본 측 자동 후보 검색(Yahoo 등)은 보류 중 — 라쿠텐/야후 모두 일본 전화번호를
 * 요구해서 막힘. 결정 전까지는 한국 수입 통계 + 환율만 조회하고, 일본 상품
 * 정보는 프런트에서 사용자가 직접 입력한다 (app/research/page.tsx 참고).
 */
export async function POST(req: NextRequest) {
  const { hsCode } = await req.json();

  if (!hsCode || typeof hsCode !== "string") {
    return NextResponse.json({ error: "hsCode가 필요합니다." }, { status: 400 });
  }

  try {
    const [tradeSignal, fxRate] = await Promise.all([
      fetchKoreaJapanTradeSignal(hsCode),
      fetchJpyToKrwRate(),
    ]);

    return NextResponse.json({ tradeSignal, fxRate });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
