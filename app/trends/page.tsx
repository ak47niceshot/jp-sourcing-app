"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { suggestHsCodes } from "@/lib/hsCodes";
import type { TrendDashboardItem } from "@/lib/trendDashboard";
import type { PriceGapItem } from "@/app/api/price-gap/route";

function growthLabel(percent: number) {
  return `${percent >= 0 ? "▲" : "▼"}${Math.abs(percent).toFixed(0)}%`;
}

function growthColor(percent: number) {
  return percent >= 0
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";
}

export default function TrendsPage() {
  const [items, setItems] = useState<TrendDashboardItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [priceGapItems, setPriceGapItems] = useState<PriceGapItem[] | null>(null);
  const [priceGapLoading, setPriceGapLoading] = useState(true);
  const [priceGapError, setPriceGapError] = useState<string | null>(null);

  const [snapshotStatus, setSnapshotStatus] = useState<{
    weeksCaptured: number;
  } | null>(null);

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
          네이버 쇼핑인사이트 + 관세청 수입 통계를 기준으로, 지금 파악해볼 만한 아이템을
          찾아드려요.
        </p>
      </div>

      <section className="border border-black/10 dark:border-white/10 rounded p-4">
        <h2 className="font-semibold mb-1">지금 뜨는 순위</h2>
        <p className="text-xs opacity-50 mb-3">
          작년 같은 시기 대비 증감율(YoY) 우선 정렬 — 계절 자체의 흐름은 상쇄하고, 작년
          이맘때보다 유독 더/덜 뜨는 것만 남겨요. YoY 데이터가 아직 없는 키워드는 최근 증감율로
          대신 정렬돼요. 클릭하면 리서치 화면으로 넘어가서 라쿠텐 후보를 바로 찾아드려요.
        </p>

        {loading && <p className="text-xs opacity-50">순위 계산 중...</p>}
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        {items && items.length === 0 && (
          <p className="text-xs opacity-50">계산할 데이터가 없어요.</p>
        )}
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
                    <span className={`text-xs w-20 text-right ${growthColor(item.growthPercent)}`}>
                      최근 {growthLabel(item.growthPercent)}
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
            자체 축적 데이터: {snapshotStatus.weeksCaptured}주차 — 몇 주 더 쌓이면 &ldquo;네이버
            관심이 관세청 수입량보다 몇 주 앞서는지&rdquo; 같은 분석도 가능해져요.
          </p>
        )}
      </section>

      <section className="border border-black/10 dark:border-white/10 rounded p-4">
        <h2 className="font-semibold mb-1">가격 신호</h2>
        <p className="text-xs opacity-50 mb-3">
          관세청 평균 수입단가($/kg) 증감 · 인기가 아니라 원가 경쟁력을 직접 봐요. HS코드가
          매칭되는 키워드만 계산돼요.
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
    </div>
  );
}
