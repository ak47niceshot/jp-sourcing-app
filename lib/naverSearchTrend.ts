export type SearchTrendPoint = { period: string; ratio: number };
export type SearchTrendGroup = {
  title: string;
  keywords: string[];
  points: SearchTrendPoint[];
};

type TrendOptions = {
  startDate?: string;
  endDate?: string;
  timeUnit?: "date" | "week" | "month";
};

/**
 * 네이버 데이터랩 검색어트렌드 API — 네이버 통합검색 기준 검색량 추이(상대 지수, 0~100).
 * 쇼핑인사이트(분야 코드 필요)와 달리 자유 키워드로 바로 조회 가능해서, lib/hsCodes.ts
 * 큐레이션 키워드가 실제로 요즘 검색되는지 확인하는 용도로 쓴다.
 *
 * NAVER API HUB 개발 가이드로 확인함(2026-08-25).
 * POST https://naverapihub.apigw.ntruss.com/search-trend/v1/search
 */
export async function fetchSearchTrend(
  keywordGroups: { groupName: string; keywords: string[] }[],
  { startDate, endDate, timeUnit = "week" }: TrendOptions = {}
): Promise<SearchTrendGroup[]> {
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
    "https://naverapihub.apigw.ntruss.com/search-trend/v1/search",
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
        keywordGroups,
      }),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`네이버 검색어트렌드 API 요청 실패 (${res.status}): ${body}`);
  }

  const data = await res.json();

  return (data.results ?? []).map(
    (r: { title: string; keywords: string[]; data: SearchTrendPoint[] }) => ({
      title: r.title,
      keywords: r.keywords,
      points: r.data ?? [],
    })
  );
}
