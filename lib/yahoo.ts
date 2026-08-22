export type YahooItem = {
  itemName: string;
  itemUrl: string;
  imageUrl: string;
  priceJpy: number;
  sellerName: string;
  reviewCount: number;
  reviewAverage: number;
};

export type JapanCandidates = {
  keyword: string;
  items: YahooItem[];
};

/**
 * Yahoo! JAPAN Shopping 商品検索API (v3).
 * https://developer.yahoo.co.jp/webapi/shopping/v3/itemsearch.html
 */
export async function fetchJapanCandidatesByKeyword(
  keyword: string,
  results = 20
): Promise<JapanCandidates> {
  const appId = process.env.YAHOO_APP_ID;
  if (!appId) {
    throw new Error("YAHOO_APP_ID 환경변수가 설정되지 않았습니다.");
  }

  const url = new URL(
    "https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch"
  );
  url.searchParams.set("appid", appId);
  url.searchParams.set("query", keyword);
  url.searchParams.set("results", String(results));
  url.searchParams.set("sort", "-review_count");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Yahoo 쇼핑 API 요청 실패 (${res.status}): ${body}`);
  }

  const data = await res.json();

  const items: YahooItem[] = (data.hits ?? []).map((item: any) => ({
    itemName: item.name,
    itemUrl: item.url,
    imageUrl: item.image?.medium ?? item.image?.small ?? "",
    priceJpy: Number(item.price) || 0,
    sellerName: item.seller?.name ?? "",
    reviewCount: Number(item.review?.count) || 0,
    reviewAverage: Number(item.review?.rate) || 0,
  }));

  return { keyword, items };
}
