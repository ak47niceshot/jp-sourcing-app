import Anthropic from "@anthropic-ai/sdk";
import type { TrendDashboardItem } from "@/lib/trendDashboard";
import type { PriceGapItem } from "@/app/api/price-gap/route";
import { calculateMargin } from "@/lib/margin";
import { fetchJpyToKrwRate } from "@/lib/fx";
import { fetchOgImage } from "@/lib/ogImage";
import { SOURCING_CATEGORIES, type SourcingCategory } from "@/lib/categoryImage";

// 나머지 페이지(리서치/도매)와 같은 기본 가정치 — 마진 계산 공식을 앱 전체에서 통일한다.
const SHIPPING_KRW = 5000;
const CUSTOMS_DUTY_PERCENT = 8;
const VAT_PERCENT = 10;
const PLATFORM_FEE_PERCENT = 10;
const RECOMMEND_MARGIN_THRESHOLD_PERCENT = 15;

type AiSourcingSuggestion = {
  productName: string;
  category: SourcingCategory;
  reasoning: string;
  japanRetailPriceJpy: number;
  japanWholesalePriceJpy: number | null;
  koreaAvgPriceKrw: number;
  sourceUrls: string[];
};

function sanitizePageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export type SourcingRecommendation = Omit<AiSourcingSuggestion, "sourceUrls"> & {
  imageUrl: string | null;
  fxRate: number;
  japanRetailPriceKrw: number;
  japanWholesalePriceKrw: number | null;
  landedCostKrw: number;
  platformFeeKrw: number;
  marginKrw: number;
  marginPercent: number;
  verdict: "추천" | "지켜보기";
};

/**
 * 트렌드/가격 신호를 참고 자료로 주고, Claude가 실시간 웹 검색으로 일본 원가와 한국
 * 시장가를 숫자로 찾아오면, 마진 계산은 AI에게 맡기지 않고 나머지 페이지와 동일한
 * lib/margin.ts 공식으로 서버에서 직접 계산한다 — AI가 직접 계산하면 표시가 장황해지고
 * 계산도 매번 달라져서 신뢰하기 어려웠음.
 *
 * AI가 웹 검색으로 추정한 가격이라 참고용이지 확정 수치가 아님 — 화면에도 그렇게 표시한다.
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
    max_tokens: 4000,
    output_config: { effort: "low" },
    tools: [
      {
        type: "web_search_20260209",
        name: "web_search",
        max_uses: 3,
      },
    ],
    messages: [
      {
        role: "user",
        content: `너는 일본→한국 상품 소싱(수입 후 국내 판매) 전문가야. 아래 참고 자료를 보고,
지금 소싱해볼 만한 구체적인 상품을 정확히 5개 추천해줘. 웹 검색은 꼭 필요한 곳에만 아껴서 써
(최대 3번).

[참고: 네이버 쇼핑 트렌드 (한국 소비자 관심도)]
${trendSummary}

[참고: 관세청 수입단가 + 라쿠텐 가격 (원가 신호)]
${priceGapSummary}

이 참고 자료에만 갇히지 말고, 웹 검색으로 실제 한국 마켓(쿠팡, 네이버쇼핑, 지마켓 등)에서
비슷한 상품이 얼마에 팔리는지 직접 찾아봐. 참고 자료에 없는 카테고리라도, 지금 일본에서
소싱해서 한국에 팔면 괜찮을 것 같은 상품이 있으면 자유롭게 추천해도 돼 (패션의류/화장품에
국한하지 마).

중요한 제외 조건: 정식 수입에 별도 인증·허가·신고가 필요해서 개인/소규모 셀러가 바로
소싱하기 복잡한 품목은 추천하지 마. 예를 들어 기능성화장품(자외선차단·미백·주름개선 등
식약처 심사 대상), 의약외품, 건강기능식품, 의료기기, 전기용품 안전인증(KC) 대상 전자제품
등. 이런 리스크가 있는 상품이 떠오르면 같은 카테고리 안에서 인증 없이 바로 수입 가능한
일반 공산품으로 바꿔서 추천해.

각 추천 상품마다 아래 필드를 정확히 채워:
1. productName: 구체적인 상품명/종류 (예: "무선 넥밴드 선풍기" 같이 뭉뚱그리지 않고 구체적으로)
2. category: 반드시 다음 중 정확히 하나만 그대로 사용 — ${SOURCING_CATEGORIES.join(", ")}
3. reasoning: 이 상품을 왜 추천하는지 3~5문장으로 상세히. 위 참고자료의 네이버 인기지수/YoY나
   관세청 단가 변동 등 구체적인 수치를 인용하고, 없으면 웹 검색으로 확인한 시장 상황을 근거로
   들어. 규제·통관·경쟁 같은 리스크 요인이 있으면 반드시 언급해.
4. japanRetailPriceJpy: 일본 소매가 추정치 (정수, 엔화, 웹 검색으로 확인)
5. japanWholesalePriceJpy: 일본 도매가 (정수, 엔화). 확인 안 되면 null.
6. koreaAvgPriceKrw: 한국 시장 평균 판매가 (정수, 원화, 웹 검색으로 확인한 실제 가격대의 대표값
   하나 — 범위 말고 숫자 하나로)
7. sourceUrls: 이 상품의 가격을 확인하려고 실제로 웹 검색해서 들어가본 상품 상세 페이지
   URL을 최대 3개까지 배열로. 검색 결과 목록 URL이나 지어낸 URL 말고, 진짜 접속해서
   가격을 확인한 페이지 주소만. 여러 사이트에서 같은 상품을 봤다면 전부 적어줘 — 특히
   쿠팡/지마켓/네이버쇼핑은 이미지를 막아놓는 경우가 많으니, 같은 상품을 라쿠텐/11번가/
   무신사/옥션/다나와/브랜드 공식몰 등 다른 사이트에서도 봤다면 그 URL도 꼭 같이 넣어줘.
   하나도 확실하지 않으면 빈 배열 [].

숫자 필드는 콤마나 단위 없이 순수 정수로만 답해 (예: 12000, "12,000원" 아님).

반드시 아래 JSON 배열 형식으로만 답해 (다른 설명 텍스트 없이, 코드블록도 없이):
[{"productName":"...","category":"...","reasoning":"...","japanRetailPriceJpy":0,"japanWholesalePriceJpy":null,"koreaAvgPriceKrw":0,"sourceUrls":[]}]`,
      },
    ],
  });

  const rawText = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  let suggestions: AiSourcingSuggestion[] = [];
  try {
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    if (!Array.isArray(parsed)) return [];
    suggestions = parsed.map((p) => ({
      productName: String(p.productName ?? ""),
      category: SOURCING_CATEGORIES.includes(p.category) ? p.category : "기타",
      reasoning: String(p.reasoning ?? ""),
      japanRetailPriceJpy: Number(p.japanRetailPriceJpy) || 0,
      japanWholesalePriceJpy:
        p.japanWholesalePriceJpy === null || p.japanWholesalePriceJpy === undefined
          ? null
          : Number(p.japanWholesalePriceJpy) || null,
      koreaAvgPriceKrw: Number(p.koreaAvgPriceKrw) || 0,
      sourceUrls: Array.isArray(p.sourceUrls)
        ? p.sourceUrls.map(sanitizePageUrl).filter((u: string | null): u is string => u !== null)
        : [],
    }));
  } catch {
    return [];
  }

  const fxRate = await fetchJpyToKrwRate();

  return Promise.all(
    suggestions.map(async (s) => {
      const { sourceUrls, ...rest } = s;
      const costJpy = s.japanWholesalePriceJpy ?? s.japanRetailPriceJpy;
      const marginResult = calculateMargin({
        priceJpy: costJpy,
        fxRate,
        shippingKrw: SHIPPING_KRW,
        customsDutyPercent: CUSTOMS_DUTY_PERCENT,
        vatPercent: VAT_PERCENT,
        platformFeePercent: PLATFORM_FEE_PERCENT,
        targetSalePriceKrw: s.koreaAvgPriceKrw,
      });
      const imageUrl = sourceUrls.length > 0 ? await fetchOgImage(sourceUrls) : null;

      return {
        ...rest,
        imageUrl,
        fxRate,
        japanRetailPriceKrw: s.japanRetailPriceJpy * fxRate,
        japanWholesalePriceKrw:
          s.japanWholesalePriceJpy !== null ? s.japanWholesalePriceJpy * fxRate : null,
        landedCostKrw: marginResult.landedCostKrw,
        platformFeeKrw: marginResult.platformFeeKrw,
        marginKrw: marginResult.marginKrw,
        marginPercent: marginResult.marginPercent,
        verdict:
          marginResult.marginPercent >= RECOMMEND_MARGIN_THRESHOLD_PERCENT
            ? "추천"
            : "지켜보기",
      };
    })
  );
}
