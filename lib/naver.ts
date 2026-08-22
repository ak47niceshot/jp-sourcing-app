export type NaverProductItem = {
  title: string;
  link: string;
  image: string;
  lprice: number;
  hprice: number;
  mallName: string;
  productType: string;
};

export type KoreaSignal = {
  keyword: string;
  totalSellers: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  items: NaverProductItem[];
};

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

/**
 * Naver Shopping Search API is a search-result API, not a sales-volume API.
 * We use seller count + price spread as a proxy for market competitiveness.
 */
export async function fetchKoreaSignal(
  keyword: string,
  display = 40
): Promise<KoreaSignal> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다."
    );
  }

  const url = new URL("https://openapi.naver.com/v1/search/shop.json");
  url.searchParams.set("query", keyword);
  url.searchParams.set("display", String(display));
  url.searchParams.set("sort", "sim");

  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Naver API 요청 실패 (${res.status}): ${body}`);
  }

  const data = await res.json();

  const items: NaverProductItem[] = (data.items ?? []).map((item: any) => ({
    title: stripTags(item.title),
    link: item.link,
    image: item.image,
    lprice: Number(item.lprice) || 0,
    hprice: Number(item.hprice) || 0,
    mallName: item.mallName,
    productType: item.productType,
  }));

  const prices = items.map((i) => i.lprice).filter((p) => p > 0);
  const uniqueMalls = new Set(items.map((i) => i.mallName));

  return {
    keyword,
    totalSellers: uniqueMalls.size,
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
    avgPrice: prices.length
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : 0,
    items,
  };
}
