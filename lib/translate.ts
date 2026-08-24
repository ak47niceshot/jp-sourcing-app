import Anthropic from "@anthropic-ai/sdk";

/**
 * Rakuten's catalog is Japanese-only, so a Korean search keyword returns
 * zero results. Translate to a natural Japanese search term before
 * querying Rakuten. Falls back to the original keyword on any failure
 * (missing key, API error) so a translation hiccup never blocks search.
 */
export async function translateToJapaneseKeyword(
  keyword: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return keyword;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 30,
      messages: [
        {
          role: "user",
          content: `다음 상품 검색어를 일본 쇼핑몰(라쿠텐) 검색에 쓸 자연스러운 일본어 단어로 번역해줘. 다른 말 없이 번역 결과만 출력해: ${keyword}`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const translated =
      textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";

    return translated || keyword;
  } catch {
    return keyword;
  }
}
