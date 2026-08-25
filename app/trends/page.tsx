"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { suggestHsCodes } from "@/lib/hsCodes";
import type { TrendDashboardItem } from "@/lib/trendDashboard";
import type { PriceGapItem } from "@/app/api/price-gap/route";
import type { SourcingRecommendation } from "@/lib/sourcingAdvisor";

function growthLabel(percent: number) {
  return `${percent >= 0 ? "▲" : "▼"}${Math.abs(percent).toFixed(0)}%`;
}

function growthColor(percent: number) {
  return percent >= 0
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";
}

export default function TrendsPage() {
  const [recommendations, setRecommendations] = useState<SourcingRecommendation[] | null>(
    null
  );
  const [recLoading, setRecLoading] = useState(true);
  const [recError, setRecError] = useState<string | null>(null);
  const [recGeneratedAt, setRecGeneratedAt] = useState<string | null>(null);

  const [items, setItems] = useState<TrendDashboardItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [priceGapItems, setPriceGapItems] = useState<PriceGapItem[] | null>(null);
  const [priceGapLoading, setPriceGapLoading] = useState(true);
  const [priceGapError, setPriceGapError] = useState<string | null>(null);

  const [showRawData, setShowRawData] = useState(false);

  const [snapshotStatus, setSnapshotStatus] = useState<{
    weeksCaptured: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRecLoading(true);
      setRecError(null);
      try {
        const res = await fetch("/api/sourcing-advisor");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "요청 실패");
        if (!cancelled) {
          setRecommendations(data.recommendations);
          setRecGeneratedAt(data.generatedAt ?? null);
        }
      } catch (err) {
        if (!cancelled) setRecError(err instanceof Error ? err.message : "알 수 없는 오류");
      } finally {
        if (!cancelled) setRecLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/trend-dashboard");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "요청 실패");
        if (!cancelled) setItems(data.items);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "알 수 없는 오류");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPriceGapLoading(true);
      setPriceGapError(null);
      try {
        const res = await fetch("/api/price-gap");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "요청 실패");
        if (!cancelled) setPriceGapItems(data.items);
      } catch (err) {
        if (!cancelled) {
          setPriceGapError(err instanceof Error ? err.message : "알 수 없는 오류");
        }
      } finally {
        if (!cancelled) setPriceGapLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 방문할 때마다 스냅샷을 쌓는다 (키워드별로 최근 6일 안에 이미 있으면 서버에서 알아서 스킵).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetch("/api/trend-dashboard/snapshot", { method: "POST" }).catch(() => {});
      try {
        const res = await fetch("/api/trend-dashboard/snapshot");
        const data = await res.json();
        if (!cancelled && res.ok) setSnapshotStatus(data);
      } catch {
        // 통계용 부가 정보라 실패해도 화면엔 영향 없음
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold mb-1">동향</h1>
        <p className="text-sm opacity-60">
          AI가 네이버·관세청 데이터를 참고하고 실시간 웹 검색으로 한국 시장가까지 찾아서,
          지금 소싱해볼 만한 상품을 구체적으로 추천해드려요.
        </p>
      </div>

      <section className="border border-black/10 dark:border-white/10 rounded p-4">
        <h2 className="font-semibold mb-1">AI 소싱 추천</h2>
        <p className="text-xs opacity-50 mb-1">
          AI가 웹 검색으로 추정한 가격·마진이라 참고용이에요 — 실제 소싱 전엔 직접 한 번 더
          확인해주세요. 카테고리도 화장품·패션에 국한하지 않고 넓게 찾아봐요.
        </p>
        {recGeneratedAt && (
          <p className="text-xs opacity-40 mb-3">
            {new Date(recGeneratedAt).toLocaleString("ko-KR")} 기준 (하루에 한 번만
            새로 계산돼요)
          </p>
        )}

        {recLoading && (
          <p className="text-xs opacity-50">
            AI가 웹 검색하며 분석 중이에요... (조금 걸릴 수 있어요)
          </p>
        )}
        {recError && <p className="text-xs text-red-600 dark:text-red-400">{recError}</p>}
        {recommendations && recommendations.length === 0 && (
          <p className="text-xs opacity-50">추천을 만들지 못했어요. 새로고침해서 다시 시도해보세요.</p>
        )}
        {recommendations && recommendations.length > 0 && (
          <div className="flex flex-col gap-3">
            {recommendations.map((rec, i) => (
              <div
                key={`${rec.productName}-${i}`}
                className="rounded border border-black/10 dark:border-white/10 p-4"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="font-semibold">{rec.productName}</h3>
                  <span className="text-xs opacity-50">{rec.category}</span>
                </div>
                <p className="text-sm opacity-80 mb-3">{rec.reasoning}</p>
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <dt className="opacity-50 mb-0.5">한국 판매가</dt>
                    <dd className="font-medium">{rec.koreaPriceRangeKrw}</dd>
                  </div>
                  <div>
                    <dt className="opacity-50 mb-0.5">일본 원가</dt>
                    <dd className="font-medium">{rec.japanCostNote}</dd>
                  </div>
                  <div>
                    <dt className="opacity-50 mb-0.5">예상 마진</dt>
                    <dd className="font-medium">{rec.estimatedMarginNote}</dd>
                  </div>
                </dl>
                <Link
                  href={`/research?keyword=${encodeURIComponent(rec.productName)}${
                    suggestHsCodes(rec.productName)[0]
                      ? `&hsCode=${encodeURIComponent(suggestHsCodes(rec.productName)[0].code)}`
                      : ""
                  }`}
                  className="inline-block mt-3 text-xs underline opacity-70 hover:opacity-100"
                >
                  리서치에서 찾아보기 →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={() => setShowRawData((v) => !v)}
        className="text-xs underline opacity-60 hover:opacity-100 self-start"
      >
        {showRawData ? "원본 데이터 숨기기" : "원본 데이터 보기 (네이버 트렌드 · 관세청 단가)"}
      </button>

      {showRawData && (
        <>
          <section className="border border-black/10 dark:border-white/10 rounded p-4">
            <h2 className="font-semibold mb-1">지금 뜨는 순위</h2>
            <p className="text-xs opacity-50 mb-3">
              작년 같은 시기 대비 증감율(YoY) 우선 정렬. 클릭하면 리서치 화면으로 넘어가서
              라쿠텐 후보를 바로 찾아드려요.
            </p>

            {loading && <p className="text-xs opacity-50">순위 계산 중...</p>}
            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
            {items && items.length > 0 && (
              <ol className="flex flex-col gap-1.5">
                {items.map((item, i) => {
                  const matchedHsCode = suggestHsCodes(item.keyword)[0]?.code ?? "";
                  const href = matchedHsCode
                    ? `/research?keyword=${encodeURIComponent(item.keyword)}&hsCode=${encodeURIComponent(matchedHsCode)}`
                    : `/research?keyword=${encodeURIComponent(item.keyword)}`;
                  return (
                    <li key={`${item.categoryCode}-${item.keyword}`}>
                      <Link
                        href={href}
                        className="w-full flex items-center gap-3 text-left text-sm rounded border border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 px-3 py-2 transition"
                      >
                        <span className="w-5 shrink-0 opacity-40 text-xs">{i + 1}</span>
                        <span className="flex-1">
                          <span className="font-medium">{item.keyword}</span>
                          <span className="text-xs opacity-50 ml-2">{item.categoryLabel}</span>
                        </span>
                        <span className="text-xs opacity-50 w-16 text-right">
                          인기 {item.recentAvg.toFixed(0)}
                        </span>
                        <span
                          className={`text-xs font-semibold w-24 text-right ${
                            item.yoyGrowthPercent === null
                              ? "opacity-40"
                              : growthColor(item.yoyGrowthPercent)
                          }`}
                        >
                          {item.yoyGrowthPercent === null
                            ? "YoY 없음"
                            : `YoY ${growthLabel(item.yoyGrowthPercent)}`}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}

            {snapshotStatus && (
              <p className="text-xs opacity-40 mt-3">
                자체 축적 데이터: {snapshotStatus.weeksCaptured}주차
              </p>
            )}
          </section>

          <section className="border border-black/10 dark:border-white/10 rounded p-4">
            <h2 className="font-semibold mb-1">가격 신호</h2>
            <p className="text-xs opacity-50 mb-3">
              관세청 평균 수입단가($/kg) 증감. HS코드가 매칭되는 키워드만 계산돼요.
            </p>

            {priceGapLoading && <p className="text-xs opacity-50">계산 중...</p>}
            {priceGapError && (
              <p className="text-xs text-red-600 dark:text-red-400">{priceGapError}</p>
            )}
            {priceGapItems && priceGapItems.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {priceGapItems.map((item) => (
                  <div
                    key={item.keyword}
                    className="flex items-center gap-3 text-sm rounded border border-black/10 dark:border-white/10 px-3 py-2"
                  >
                    <span className="flex-1">
                      <span className="font-medium">{item.keyword}</span>
                      <span className="text-xs opacity-50 ml-2">HS {item.hsCode}</span>
                    </span>
                    <span className="text-xs w-32 text-right opacity-70">
                      {item.unitPriceChangePercent === null
                        ? "단가 데이터 없음"
                        : `단가 ${growthLabel(item.unitPriceChangePercent)}`}
                    </span>
                    <span className="text-xs w-40 text-right opacity-70">
                      {item.rakutenAvgPriceKrw !== null
                        ? `라쿠텐 평균 ${Math.round(item.rakutenAvgPriceKrw).toLocaleString()}원 (${item.rakutenItemCount}개)`
                        : "라쿠텐 연동 필요"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
