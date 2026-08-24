export type RakutenItem = {
  itemName: string;
  itemUrl: string;
  imageUrl: string;
  priceJpy: number;
  shopName: string;
  reviewCount: number;
  reviewAverage: number;
  /** 라쿠텐 상품 상세 설명 원문(일본어). 검색 API 응답의 itemCaption. */
  description: string;
};

export type JapanCandidates = {
  keyword: string;
  items: RakutenItem[];
};

/**
 * Rakuten migrated its whole API infra in May 2026: endpoint moved from
 * app.rakuten.co.jp -> openapi.rakuten.co.jp, path changed
 * (/services/api/... -> /ichibams/api/...), and a new accessKey is now
 * required alongside applicationId. Also enforces an IP allowlist
 * configured per-app in the Rakuten Developers dashboard.
 * https://webservice.rakuten.co.jp/documentation
 */
export async function fetchJapanCandidatesByKeyword(
  keyword: string,
  hits = 20
): Promise<JapanCandidates> {
  const applicationId = process.env.RAKUTEN_APPLICATION_ID;
  const accessKey = process.env.RAKUTEN_ACCESS_KEY;

  if (!applicationId || !accessKey) {
    throw new Error(
      "RAKUTEN_APPLICATION_ID / RAKUTEN_ACCESS_KEY 환경변수가 설정되지 않았습니다."
    );
  }

  const url = new URL(
    "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701"
  );
  url.searchParams.set("applicationId", applicationId);
  url.searchParams.set("accessKey", accessKey);
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
    description: item.itemCaption ?? "",
  }));

  return { keyword, items };
}
