import Anthropic from "@anthropic-ai/sdk";
import type { KoreaSignal } from "@/lib/naver";
import type { RakutenItem } from "@/lib/rakuten";
import type { MarginInputs, MarginResult } from "@/lib/margin";

export type AnalyzeInput = {
  keyword: string;
  koreaSignal: KoreaSignal;
  japanItem: RakutenItem;
  marginInputs: MarginInputs;
  marginResult: MarginResult;
};

export async function analyzeCandidate(input: AnalyzeInput): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.");
  }

  const client = new Anthropic({ apiKey });

  const prompt = `너는 일본→한국 상품 소싱 리서치를 돕는 분석가야. 아래 데이터를 보고 이 상품의 소싱 경쟁력을 한국어로 짧게(4~6문장) 평가해줘.
평가에는 다음을 반드시 포함해:
1) 한국 시장 경쟁 강도(판매처 수, 가격대)에 대한 판단
2) 마진율이 소싱을 진행할 만한 수준인지에 대한 판단
3) 리스크나 추가로 확인이 필요한 부분

[검색 키워드]
${input.keyword}

[한국 시장 시그널 - 네이버 쇼핑 검색 기준]
- 판매처 수: ${input.koreaSignal.totalSellers}
- 최저가: ${input.koreaSignal.minPrice.toLocaleString()}원
- 최고가: ${input.koreaSignal.maxPrice.toLocaleString()}원
- 평균가: ${input.koreaSignal.avgPrice.toLocaleString()}원

[일본 소싱 후보 - 라쿠텐 기준]
- 상품명: ${input.japanItem.itemName}
- 판매가: ${input.japanItem.priceJpy.toLocaleString()}엔
- 판매처: ${input.japanItem.shopName}
- 리뷰 수: ${input.japanItem.reviewCount}
- 리뷰 평점: ${input.japanItem.reviewAverage}

[마진 계산 결과]
- 환율: 1엔 = ${input.marginInputs.fxRate}원
- 국제 배송비: ${input.marginInputs.shippingKrw.toLocaleString()}원
- 관세율: ${input.marginInputs.customsDutyPercent}%
- 부가세율: ${input.marginInputs.vatPercent}%
- 플랫폼 수수료율: ${input.marginInputs.platformFeePercent}%
- 목표 판매가: ${input.marginInputs.targetSalePriceKrw.toLocaleString()}원
- 예상 마진액: ${Math.round(input.marginResult.marginKrw).toLocaleString()}원
- 예상 마진율: ${input.marginResult.marginPercent.toFixed(1)}%`;

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : "";
}
