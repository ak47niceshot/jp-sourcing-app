export type RakutenItem = {
  itemName: string;
  itemUrl: string;
  imageUrl: string;
  priceJpy: number;
  shopName: string;
  reviewCount: number;
  reviewAverage: number;
  rank?: number;
};

export type JapanCandidates = {
  keyword: string;
  items: RakutenItem[];
};

function requireAppId(): string {
  const appId = process.env.RAKUTEN_APP_ID;
  if (!appId) {
    throw new Error("RAKUTEN_APP_ID 환경변수가 설정되지 않았습니다.");
  }
  return appId;
}

/**
 * Rakuten Ichiba Item Search API — keyword-based product search.
 * https://webservice.rakuten.co.jp/documentation/ichiba-item-search
 */
export async function fetchJapanCandidatesByKeyword(
  keyword: string,
  hits = 20
): Promise<JapanCandidates> {
  const appId = requireAppId();

  const url = new URL(
    "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601"
  );
  url.searchParams.set("applicationId", appId);
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("hits", String(hits));
  url.searchParams.set("sort", "-reviewCount");
  url.searchParams.set("formatVersion", "2");

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Rakuten API 요청 실패 (${res.status}): ${body}`);
  }

  const data = await res.json();

  const items: RakutenItem[] = (data.Items ?? []).map((item: any) => ({
    itemName: item.itemName,
    itemUrl: item.itemUrl,
    imageUrl: item.mediumImageUrls?.[0] ?? "",
    priceJpy: Number(item.itemPrice) || 0,
    shopName: item.shopName,
    reviewCount: Number(item.reviewCount) || 0,
    reviewAverage: Number(item.reviewAverage) || 0,
  }));

  return { keyword, items };
}

/**
 * Rakuten Ichiba Genre Ranking API — real bestseller ranking by genre.
 * genreId 0 = 전체 장르. 장르 ID는 라쿠텐 장르검색 API로 조회 가능.
 * https://webservice.rakuten.co.jp/documentation/ichiba-genre-ranking
 */
export async function fetchJapanRankingByGenre(
  genreId = 0
): Promise<JapanCandidates> {
  const appId = requireAppId();

  const url = new URL(
    "https://app.rakuten.co.jp/services/api/IchibaItem/Ranking/20220601"
  );
  url.searchParams.set("applicationId", appId);
  url.searchParams.set("genreId", String(genreId));
  url.searchParams.set("formatVersion", "2");

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Rakuten Ranking API 요청 실패 (${res.status}): ${body}`);
  }

  const data = await res.json();

  const items: RakutenItem[] = (data.Items ?? []).map((item: any) => ({
    itemName: item.itemName,
    itemUrl: item.itemUrl,
    imageUrl: item.mediumImageUrls?.[0] ?? "",
    priceJpy: Number(item.itemPrice) || 0,
    shopName: item.shopName,
    reviewCount: Number(item.reviewCount) || 0,
    reviewAverage: Number(item.reviewAverage) || 0,
    rank: Number(item.rank) || undefined,
  }));

  return { keyword: `genre:${genreId}`, items };
}
