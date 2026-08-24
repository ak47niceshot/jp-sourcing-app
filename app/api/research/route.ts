import { NextRequest, NextResponse } from "next/server";
import { fetchKoreaJapanTradeSignal } from "@/lib/trade";
import { fetchJpyToKrwRate } from "@/lib/fx";
import { fetchJapanCandidatesByKeyword } from "@/lib/rakuten";
import { translateToJapaneseKeyword } from "@/lib/translate";

/**
 * Yahoo! JAPAN 쪽 자동 검색은 보류 중(일본 전화번호 인증 이슈) — 라쿠텐은
 * 2026-05 API 개편 후 IP 화이트리스트 등록으로 사용 가능해짐. 라쿠텐에 없는
 * 상품은 프런트에서 사용자가 직접 입력할 수 있게 남겨둔다.
 *
 * 라쿠텐은 일본어 카탈로그라 한국어 키워드로는 매칭이 안 되므로, 검색 전에
 * Claude로 일본어 키워드로 번역한다.
 */
async function fetchJapanCandidates(keyword: string) {
  const translated = await translateToJapaneseKeyword(keyword);
  return fetchJapanCandidatesByKeyword(translated);
}

export async function POST(req: NextRequest) {
  const { keyword, hsCode } = await req.json();

  if (!hsCode || typeof hsCode !== "string") {
    return NextResponse.json({ error: "hsCode가 필요합니다." }, { status: 400 });
  }

  try {
    const [tradeSignal, fxRate, japanCandidates] = await Promise.all([
      fetchKoreaJapanTradeSignal(hsCode),
      fetchJpyToKrwRate(),
      keyword && typeof keyword === "string"
        ? fetchJapanCandidates(keyword)
        : Promise.resolve(null),
    ]);

    return NextResponse.json({ tradeSignal, fxRate, japanCandidates });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
