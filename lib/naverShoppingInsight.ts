export type ShoppingCategoryTrend = {
  categoryName: string;
  categoryCode: string;
  points: { period: string; ratio: number }[];
};

export type ShoppingKeywordTrend = {
  categoryCode: string;
  keyword: string;
  points: { period: string; ratio: number }[];
};

/**
 * 네이버 쇼핑인사이트(DataLab) API — 카테고리별 클릭 추이(상대 지수, 0~100).
 * 상품명/가격은 안 주는 트렌드 전용 API라, "요즘 어떤 카테고리가 뜨는지" 파악용으로만 쓴다.
 *
 * 2026-07-31 이후 신규 발급은 개발자센터가 아니라 NAVER API HUB(Naver Cloud Platform)를
 * 통해서만 가능 — 도메인/인증 헤더/경로가 기존 openapi.naver.com 방식과 다르다.
 * NAVER API HUB 콘솔의 "쇼핑 인사이트 > 분야별 트렌드 조회" 개발 가이드로 확인함(2026-08-25).
 * POST https://naverapihub.apigw.ntruss.com/shopping/v1/categories
 *
 * 분야 코드(category.param)는 공식 코드표가 따로 없고, 네이버쇼핑(shopping.naver.com)에서
 * 카테고리 클릭 시 URL의 cat_id 값으로 확인하는 방식 — lib/hsCodes.ts처럼 확인된 값만
 * lib/naverShoppingCategories.ts에 큐레이션해서 채워나간다.
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
    "https://naverapihub.apigw.ntruss.com/shopping/v1/categories",
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

/**
 * 검증된 대분류 카테고리 코드(lib/naverShoppingCategories.ts) 안에서, 특정 키워드의
 * 클릭 추이를 조회. 세부 카테고리의 cat_id를 몰라도 "화장품/미용 안에서 '스킨토너'"
 * 처럼 자유 키워드로 세부 트렌드를 볼 수 있어서, 하위 카테고리 cat_id를 직접 찾는 것보다
 * 안정적이다(2026-08-25: ns/category 경로에서 가져온 cat_id들이 전부 빈 데이터였음).
 * POST https://naverapihub.apigw.ntruss.com/shopping/v1/category/keywords
 */
export async function fetchShoppingKeywordTrend(
  categoryCode: string,
  keyword: string,
  { startDate, endDate, timeUnit = "week" }: TrendOptions = {}
): Promise<ShoppingKeywordTrend> {
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
    "https://naverapihub.apigw.ntruss.com/shopping/v1/category/keywords",
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
        category: categoryCode,
        keyword: [{ name: keyword, param: [keyword] }],
      }),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`네이버 쇼핑인사이트 키워드 API 요청 실패 (${res.status}): ${body}`);
  }

  const data = await res.json();
  const result = data.results?.[0];

  return {
    categoryCode,
    keyword,
    points: (result?.data ?? []).map((p: { period: string; ratio: number }) => ({
      period: p.period,
      ratio: p.ratio,
    })),
  };
}
