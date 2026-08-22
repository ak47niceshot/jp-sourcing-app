import Anthropic from "@anthropic-ai/sdk";
import type { TradeSignal } from "@/lib/trade";
import type { YahooItem } from "@/lib/yahoo";
import type { MarginInputs, MarginResult } from "@/lib/margin";

export type AnalyzeInput = {
  keyword: string;
  tradeSignal: TradeSignal;
  japanItem: YahooItem;
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
1) 한국의 대일본 수입 통계(금액/추세)로 볼 때 이 품목(HS코드 기준)의 수요가 늘고 있는지/줄고 있는지에 대한 판단
2) 마진율이 소싱을 진행할 만한 수준인지에 대한 판단
3) 리스크나 추가로 확인이 필요한 부분 (HS코드가 정확한 품목 분류인지, 통계는 업종 단위라 개별 상품과 다를 수 있다는 점 포함)

[검색 키워드]
${input.keyword}

[한국 수입 통계 - 관세청 무역통계, HS코드 ${input.tradeSignal.hsCode} 기준, ${input.tradeSignal.periodFrom}~${input.tradeSignal.periodTo}]
- 대일본 총 수입액: ${input.tradeSignal.totalImportDlr.toLocaleString()} 달러
- 대일본 총 수입 중량: ${input.tradeSignal.totalImportWgt.toLocaleString()} kg
- 월별 추이(최근 몇 개월): ${input.tradeSignal.monthly
    .slice(-6)
    .map((m) => `${m.yearMonth}: ${m.importDlr.toLocaleString()}달러`)
    .join(", ")}

[일본 소싱 후보 - Yahoo! JAPAN 쇼핑 기준]
- 상품명: ${input.japanItem.itemName}
- 판매가: ${input.japanItem.priceJpy.toLocaleString()}엔
- 판매자: ${input.japanItem.sellerName}
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
