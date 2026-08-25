import { NextResponse } from "next/server";
import { fetchKoreaJapanTradeSignal } from "@/lib/trade";
import { fetchJapanCandidatesByKeyword } from "@/lib/rakuten";
import { translateToJapaneseKeyword } from "@/lib/translate";
import { fetchJpyToKrwRate } from "@/lib/fx";
import { computeUnitPriceTrend } from "@/lib/priceGap";
import { suggestHsCodes } from "@/lib/hsCodes";
import { SHOPPING_KEYWORDS_BY_CATEGORY } from "@/lib/naverShoppingKeywords";

export type PriceGapItem = {
  keyword: string;
  hsCode: string;
  hsLabel: string;
  unitPriceChangePercent: number | null;
  rakutenAvgPriceKrw: number | null;
  rakutenItemCount: number;
  rakutenError: string | null;
};

// SHOPPING_KEYWORDS_BY_CATEGORY 중 HS코드가 실제로 매칭되는 것만 가격 신호를 계산할 수 있다
// (관세청 API는 HS코드 기준 조회만 지원해서, 매칭 안 되는 키워드는 원가 데이터가 없음).
function curatedKeywordsWithHsMatch() {
  const allKeywords = Object.values(SHOPPING_KEYWORDS_BY_CATEGORY).flat();
  return allKeywords
    .map((keyword) => ({ keyword, match: suggestHsCodes(keyword)[0] }))
    .filter((x): x is { keyword: string; match: NonNullable<typeof x.match> } =>
      Boolean(x.match)
    );
}

export async function GET() {
  const targets = curatedKeywordsWithHsMatch();
  const fxRate = await fetchJpyToKrwRate();

  try {
    const items = await Promise.all(
      targets.map(async ({ keyword, match }) => {
        let unitPriceChangePercent: number | null = null;
        try {
          const signal = await fetchKoreaJapanTradeSignal(match.code);
          unitPriceChangePercent = computeUnitPriceTrend(signal)?.changePercent ?? null;
        } catch {
          unitPriceChangePercent = null;
        }

        let rakutenAvgPriceKrw: number | null = null;
        let rakutenItemCount = 0;
        let rakutenError: string | null = null;
        try {
          const translated = await translateToJapaneseKeyword(keyword);
          const candidates = await fetchJapanCandidatesByKeyword(translated);
          rakutenItemCount = candidates.items.length;
          if (candidates.items.length > 0) {
            const avgJpy =
              candidates.items.reduce((sum, item) => sum + item.priceJpy, 0) /
              candidates.items.length;
            rakutenAvgPriceKrw = avgJpy * fxRate;
          }
        } catch (err) {
          rakutenError = err instanceof Error ? err.message : "라쿠텐 조회 실패";
        }

        return {
          keyword,
          hsCode: match.code,
          hsLabel: match.label,
          unitPriceChangePercent,
          rakutenAvgPriceKrw,
          rakutenItemCount,
          rakutenError,
        } satisfies PriceGapItem;
      })
    );

    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
