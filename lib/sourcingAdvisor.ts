import Anthropic from "@anthropic-ai/sdk";
import type { TrendDashboardItem } from "@/lib/trendDashboard";
import type { PriceGapItem } from "@/app/api/price-gap/route";

export type SourcingRecommendation = {
  productName: string;
  category: string;
  reasoning: string;
  koreaPriceRangeKrw: string;
  japanCostNote: string;
  estimatedMarginNote: string;
};

/**
 * 트렌드/가격 신호를 참고 자료로 주고, Claude가 실시간 웹 검색으로 한국 시장가를
 * 직접 찾아서 "지금 소싱해볼 만한 구체적인 상품 + 예상 마진"까지 한 번에 정리해준다.
 * 웹 검색을 쓰기 때문에 큐레이션한 21개 키워드에 갇히지 않고 더 넓은 카테고리를
 * 추천할 수 있다.
 *
 * AI가 웹 검색으로 추정한 가격/마진이라 참고용이지 확정 수치가 아님 — 화면에도
 * 그렇게 표시한다.
 */
export async function generateSourcingRecommendations(
  trendItems: TrendDashboardItem[],
  priceGapItems: PriceGapItem[]
): Promise<SourcingRecommendation[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.");
  }

  const client = new Anthropic({ apiKey });

  const trendSummary = trendItems
    .slice(0, 15)
    .map(
      (i) =>
        `- ${i.keyword} (${i.categoryLabel}): 최근 인기지수 ${i.recentAvg.toFixed(0)}, YoY ${
          i.yoyGrowthPercent === null ? "데이터없음" : i.yoyGrowthPercent.toFixed(0) + "%"
        }`
    )
    .join("\n");

  const priceGapSummary = priceGapItems
    .map(
      (i) =>
        `- ${i.keyword} (HS ${i.hsCode}): 관세청 평균 수입단가 증감 ${
          i.unitPriceChangePercent === null ? "데이터없음" : i.unitPriceChangePercent.toFixed(0) + "%"
        }${i.rakutenAvgPriceKrw ? `, 라쿠텐 평균가 약 ${Math.round(i.rakutenAvgPriceKrw).toLocaleString()}원` : ""}`
    )
    .join("\n");

  const message = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 8000,
    tools: [
      {
        type: "web_search_20260209",
        name: "web_search",
        max_uses: 8,
      },
    ],
    messages: [
      {
        role: "user",
        content: `너는 일본→한국 상품 소싱(수입 후 국내 판매) 전문가야. 아래 참고 자료를 보고,
지금 소싱해볼 만한 구체적인 상품을 5~8개 추천해줘.

[참고: 네이버 쇼핑 트렌드 (한국 소비자 관심도)]
${trendSummary}

[참고: 관세청 수입단가 + 라쿠텐 가격 (원가 신호)]
${priceGapSummary}

이 참고 자료에만 갇히지 말고, 웹 검색으로 실제 한국 마켓(쿠팡, 네이버쇼핑, 지마켓 등)에서
비슷한 상품이 얼마에 팔리는지 직접 찾아봐. 참고 자료에 없는 카테고리라도, 지금 일본에서
소싱해서 한국에 팔면 괜찮을 것 같은 상품이 있으면 자유롭게 추천해도 돼 (패션의류/화장품에
국한하지 마).

각 추천 상품마다:
1. 구체적인 상품명/종류 (예: "무선 넥밴드 선풍기" 같이 뭉뚱그리지 않고 구체적으로)
2. 추천 이유 (수요 신호, 트렌드, 또는 시장 상황)
3. 한국 시장 평균 판매가 범위 (웹 검색으로 확인한 실제 가격대, 원화)
4. 일본 쪽 예상 원가 (참고자료에 있으면 활용, 없으면 대략적인 추정)
5. 예상 마진에 대한 코멘트 (관세/배송비/수수료 감안한 대략적인 판단)

반드시 아래 JSON 배열 형식으로만 답해 (다른 설명 텍스트 없이, 코드블록도 없이):
[{"productName":"...","category":"...","reasoning":"...","koreaPriceRangeKrw":"...","japanCostNote":"...","estimatedMarginNote":"..."}]`,
      },
    ],
  });

  const rawText = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  try {
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((p) => ({
      productName: String(p.productName ?? ""),
      category: String(p.category ?? ""),
      reasoning: String(p.reasoning ?? ""),
      koreaPriceRangeKrw: String(p.koreaPriceRangeKrw ?? ""),
      japanCostNote: String(p.japanCostNote ?? ""),
      estimatedMarginNote: String(p.estimatedMarginNote ?? ""),
    }));
  } catch {
    return [];
  }
}
