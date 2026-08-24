import Anthropic from "@anthropic-ai/sdk";
import type { RakutenItem } from "@/lib/rakuten";

export type ProductDescription = {
  summaryKo: string;
  keywords: string[];
};

/**
 * 라쿠텐 상품명+상세설명(일본어)을 한국어로 요약/설명하고, 검색·마케팅에 쓸
 * 만한 키워드를 뽑아준다.
 */
export async function describeProductInKorean(
  item: RakutenItem
): Promise<ProductDescription> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.");
  }

  const client = new Anthropic({ apiKey });

  const captionExcerpt = item.description
    ? item.description.replace(/\s+/g, " ").slice(0, 2000)
    : "(상세 설명 없음)";

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `아래는 라쿠텐(일본 쇼핑몰) 상품의 제목과 상세설명이야. 이걸 보고:
1) 한국어로 이 상품이 뭔지, 특징이 뭔지 3~4문장으로 자연스럽게 설명해줘 (번역이 아니라 설명)
2) 이 상품을 한국에서 판매/검색할 때 쓸 만한 한국어 키워드를 5~8개 뽑아줘

반드시 아래 JSON 형식으로만 답해 (다른 텍스트 없이):
{"summaryKo": "...", "keywords": ["...", "..."]}

[상품명]
${item.itemName}

[상세설명]
${captionExcerpt}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  const raw = textBlock && textBlock.type === "text" ? textBlock.text : "{}";

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    return {
      summaryKo: String(parsed.summaryKo ?? ""),
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : [],
    };
  } catch {
    return { summaryKo: raw, keywords: [] };
  }
}
