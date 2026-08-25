export type ShoppingCategoryTrend = {
  categoryName: string;
  categoryCode: string;
  points: { period: string; ratio: number }[];
};

/**
 * 네이버 쇼핑인사이트(DataLab) API — 카테고리별 클릭 추이(상대 지수, 0~100).
 * 상품명/가격은 안 주는 트렌드 전용 API라, "요즘 어떤 카테고리가 뜨는지" 파악용으로만 쓴다.
 *
 * 2026-07-31 이후 신규 발급은 개발자센터가 아니라 NAVER API HUB(Naver Cloud Platform)를
 * 통해서만 가능 — 도메인/인증 헤더가 기존 openapi.naver.com 방식과 다르다.
 * https://naverapihub.apigw.ntruss.com/datalab/v1/...
 *
 * 카테고리 코드는 아직 실제 키로 검증하지 않았다 (2026-08-25 기준, NAVER_CLIENT_ID/SECRET
 * 발급 전) — lib/hsCodes.ts 사례처럼, 발급 후 실제 API 응답으로 하나씩 검증해서
 * lib/naverShoppingCategories.ts 같은 큐레이션 목록을 채워야 한다. 여기서는 호출부만 구현.
 */
type TrendOptions = {
  startDate?: string;
  endDate?: string;
  timeUnit?: "date" | "week" | "month";
};

export async function fetchShoppingCategoryTrend(
  categoryName: string,
  categoryCode: string,
  { startDate, endDate, timeUnit = "week" }: TrendOptions = {}
): Promise<ShoppingCategoryTrend> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다."
    );
  }

  const now = new Date();
  const end = endDate ?? now.toISOString().slice(0, 10);
  const start =
    startDate ??
    new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
      .toISOString()
      .slice(0, 10);

  const res = await fetch(
    "https://naverapihub.apigw.ntruss.com/datalab/v1/shopping/categories",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-NCP-APIGW-API-KEY-ID": clientId,
        "X-NCP-APIGW-API-KEY": clientSecret,
      },
      body: JSON.stringify({
        startDate: start,
        endDate: end,
        timeUnit,
        category: [{ name: categoryName, param: [categoryCode] }],
      }),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`네이버 쇼핑인사이트 API 요청 실패 (${res.status}): ${body}`);
  }

  const data = await res.json();
  const result = data.results?.[0];

  return {
    categoryName,
    categoryCode,
    points: (result?.data ?? []).map((p: { period: string; ratio: number }) => ({
      period: p.period,
      ratio: p.ratio,
    })),
  };
}
