"use client";

import { useEffect, useRef, useState } from "react";
import { calculateMargin, MarginInputs, MarginResult } from "@/lib/margin";
import { suggestHsCodes } from "@/lib/hsCodes";
import { SHOPPING_CATEGORIES } from "@/lib/naverShoppingCategories";
import { SHOPPING_KEYWORDS_BY_CATEGORY } from "@/lib/naverShoppingKeywords";
import type { TradeSignal } from "@/lib/trade";
import type { RakutenItem } from "@/lib/rakuten";
import type { ShoppingCategoryTrend, ShoppingKeywordTrend } from "@/lib/naverShoppingInsight";
import type { SearchTrendGroup } from "@/lib/naverSearchTrend";

type ResearchResponse = {
  tradeSignal: TradeSignal;
  fxRate: number;
  japanCandidates: { keyword: string; items: RakutenItem[] } | null;
};

const DEFAULT_MARGIN_INPUTS: Omit<MarginInputs, "priceJpy" | "fxRate"> = {
  shippingKrw: 5000,
  customsDutyPercent: 8,
  vatPercent: 10,
  platformFeePercent: 10,
  targetSalePriceKrw: 0,
};

const EMPTY_JAPAN_ITEM: RakutenItem = {
  itemName: "",
  itemUrl: "",
  imageUrl: "",
  priceJpy: 0,
  shopName: "",
  reviewCount: 0,
  reviewAverage: 0,
  description: "",
};

type RecentSearch = { keyword: string; hsCode: string };
const RECENT_SEARCHES_KEY = "jp-sourcing-recent-searches";
const MAX_RECENT_SEARCHES = 8;

function loadRecentSearches(): RecentSearch[] {
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(list: RecentSearch[]) {
  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list));
  } catch {
    // 저장 실패해도 검색 자체엔 영향 없게 무시
  }
}

export default function ResearchPage() {
  const [keyword, setKeyword] = useState("");
  const [hsCode, setHsCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResponse | null>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [japanItem, setJapanItem] = useState<RakutenItem>(EMPTY_JAPAN_ITEM);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [marginInputs, setMarginInputs] = useState<MarginInputs | null>(null);
  const [aiComment, setAiComment] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [productDescription, setProductDescription] = useState<{
    summaryKo: string;
    keywords: string[];
  } | null>(null);
  const [describing, setDescribing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  const [selectedCategoryCode, setSelectedCategoryCode] = useState<string | null>(null);
  const [trend, setTrend] = useState<ShoppingCategoryTrend | null>(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);

  const [categoryKeyword, setCategoryKeyword] = useState("");
  const [categoryKeywordTrend, setCategoryKeywordTrend] =
    useState<ShoppingKeywordTrend | null>(null);
  const [categoryKeywordLoading, setCategoryKeywordLoading] = useState(false);
  const [categoryKeywordError, setCategoryKeywordError] = useState<string | null>(null);

  const [searchTrend, setSearchTrend] = useState<SearchTrendGroup | null>(null);
  const [searchTrendLoading, setSearchTrendLoading] = useState(false);
  const [searchTrendError, setSearchTrendError] = useState<string | null>(null);

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  async function handleCategoryClick(code: string, label: string) {
    setSelectedCategoryCode(code);
    setTrendLoading(true);
    setTrendError(null);
    setTrend(null);
    setCategoryKeyword("");
    setCategoryKeywordTrend(null);
    setCategoryKeywordError(null);
    try {
      const res = await fetch("/api/trend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryName: label, categoryCode: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "요청 실패");
      setTrend(data);
    } catch (err) {
      setTrendError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setTrendLoading(false);
    }
  }

  async function handleCategoryKeywordCheck(nextKeyword: string) {
    setCategoryKeyword(nextKeyword);
    if (!selectedCategoryCode || !nextKeyword) return;
    setCategoryKeywordLoading(true);
    setCategoryKeywordError(null);
    setCategoryKeywordTrend(null);
    try {
      const res = await fetch("/api/shopping-keyword-trend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryCode: selectedCategoryCode,
          keyword: nextKeyword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "요청 실패");
      setCategoryKeywordTrend(data);
    } catch (err) {
      setCategoryKeywordError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setCategoryKeywordLoading(false);
    }
  }

  async function handleSearchTrendCheck() {
    if (!keyword.trim()) return;
    setSearchTrendLoading(true);
    setSearchTrendError(null);
    setSearchTrend(null);
    try {
      const res = await fetch("/api/search-trend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "요청 실패");
      setSearchTrend(data);
    } catch (err) {
      setSearchTrendError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setSearchTrendLoading(false);
    }
  }

  function addRecentSearch(nextKeyword: string, nextHsCode: string) {
    setRecentSearches((prev) => {
      const deduped = prev.filter(
        (s) => !(s.keyword === nextKeyword && s.hsCode === nextHsCode)
      );
      const next = [{ keyword: nextKeyword, hsCode: nextHsCode }, ...deduped].slice(
        0,
        MAX_RECENT_SEARCHES
      );
      saveRecentSearches(next);
      return next;
    });
  }

  const hsSuggestions = suggestHsCodes(keyword);

  const marginResult: MarginResult | null = marginInputs
    ? calculateMargin(marginInputs)
    : null;

  function updateUrl(nextKeyword: string, nextHsCode: string, itemIndex: number | null) {
    const params = new URLSearchParams();
    if (nextKeyword) params.set("keyword", nextKeyword);
    if (nextHsCode) params.set("hsCode", nextHsCode);
    if (itemIndex !== null) params.set("item", String(itemIndex));
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }

  async function runSearch(
    searchKeyword: string,
    searchHsCode: string
  ): Promise<ResearchResponse | null> {
    if (!searchHsCode.trim()) return null;

    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedIndex(null);
    setShowManualEntry(false);
    setJapanItem(EMPTY_JAPAN_ITEM);
    setMarginInputs(null);
    setAiComment(null);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: searchKeyword, hsCode: searchHsCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "요청 실패");
      setResult(data);
      return data as ResearchResponse;
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!hsCode.trim()) return;
    updateUrl(keyword, hsCode, null);
    addRecentSearch(keyword, hsCode);
    await runSearch(keyword, hsCode);
  }

  function handleRecentSearchClick(entry: RecentSearch) {
    setKeyword(entry.keyword);
    setHsCode(entry.hsCode);
    updateUrl(entry.keyword, entry.hsCode, null);
    addRecentSearch(entry.keyword, entry.hsCode);
    runSearch(entry.keyword, entry.hsCode);
  }

  // 새로고침해도 검색 결과/선택 상품이 유지되도록 URL 쿼리에서 복원
  const restoredFromUrl = useRef(false);
  useEffect(() => {
    if (restoredFromUrl.current) return;
    restoredFromUrl.current = true;

    const params = new URLSearchParams(window.location.search);
    const urlKeyword = params.get("keyword") ?? "";
    const urlHsCode = params.get("hsCode") ?? "";
    const urlItemIndex = params.get("item");

    setKeyword(urlKeyword);
    setHsCode(urlHsCode);

    if (!urlHsCode) return;

    runSearch(urlKeyword, urlHsCode).then((data) => {
      if (!data || urlItemIndex === null) return;
      const idx = Number(urlItemIndex);
      const item = data.japanCandidates?.items[idx];
      if (item) selectItemFromData(data, idx, item);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectItemFromData(data: ResearchResponse, index: number, item: RakutenItem) {
    setSelectedIndex(index);
    setShowManualEntry(false);
    setJapanItem(item);
    startMargin(item, data.fxRate);
  }

  function handleSelectItem(index: number) {
    if (!result?.japanCandidates) return;
    const item = result.japanCandidates.items[index];
    updateUrl(keyword, hsCode, index);
    selectItemFromData(result, index, item);
  }

  function updateJapanItem<K extends keyof RakutenItem>(key: K, value: RakutenItem[K]) {
    setJapanItem((prev) => ({ ...prev, [key]: value }));
  }

  function startMargin(item: RakutenItem, fxRate: number) {
    if (!item.itemName.trim() || item.priceJpy <= 0) return;
    setAiComment(null);
    setSaveMessage(null);
    setProductDescription(null);

    const costKrw = item.priceJpy * fxRate;
    const landedCostKrw =
      (costKrw + DEFAULT_MARGIN_INPUTS.shippingKrw) *
      (1 +
        DEFAULT_MARGIN_INPUTS.customsDutyPercent / 100 +
        DEFAULT_MARGIN_INPUTS.vatPercent / 100);
    // 원가+배송비+관/부가세를 다 반영하고도 대략 20% 마진이 남는 가격으로 기본값을 잡는다
    const TARGET_MARGIN_PERCENT = 20;
    const denominator =
      1 - DEFAULT_MARGIN_INPUTS.platformFeePercent / 100 - TARGET_MARGIN_PERCENT / 100;

    setMarginInputs({
      priceJpy: item.priceJpy,
      fxRate,
      ...DEFAULT_MARGIN_INPUTS,
      targetSalePriceKrw: Math.round(landedCostKrw / denominator),
    });
  }

  function updateMarginInput(key: keyof MarginInputs, value: number) {
    setMarginInputs((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleAnalyze() {
    if (!result || !marginInputs || !marginResult) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword,
          tradeSignal: result.tradeSignal,
          japanItem,
          marginInputs,
          marginResult,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI 분석 실패");
      setAiComment(data.comment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleDescribe() {
    if (!japanItem.itemName.trim()) return;
    setDescribing(true);
    setError(null);
    try {
      const res = await fetch("/api/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ japanItem }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "상품 설명 생성 실패");
      setProductDescription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setDescribing(false);
    }
  }

  async function handleSave() {
    if (!result || !marginInputs || !marginResult) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword,
          hsCode,
          tradeSignal: result.tradeSignal,
          japanItem,
          marginInputs,
          marginResult,
          aiComment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      setSaveMessage("저장했어요.");
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="border border-black/10 dark:border-white/10 rounded p-4">
        <h2 className="font-semibold mb-1">요즘 뜨는 카테고리 (네이버 쇼핑인사이트)</h2>
        <p className="text-xs opacity-50 mb-3">
          한국 소비자의 실제 클릭 트렌드 (0~100 상대 지수) · 상품명·가격은 안 나와요 —
          아이템 후보는 아래에서 라쿠텐으로 검색해서 찾아보세요.
        </p>
        <div className="flex flex-wrap gap-2 text-xs mb-3">
          {SHOPPING_CATEGORIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => handleCategoryClick(c.code, c.label)}
              className={`px-2 py-1 rounded border ${
                selectedCategoryCode === c.code
                  ? "border-foreground bg-black/5 dark:bg-white/10"
                  : "border-black/15 dark:border-white/20"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {trendLoading && <p className="text-xs opacity-50">불러오는 중...</p>}
        {trendError && (
          <p className="text-xs text-red-600 dark:text-red-400">{trendError}</p>
        )}
        {trend && trend.points.length > 0 && (
          <div className="flex flex-col gap-1">
            {trend.points.map((p) => (
              <div key={p.period} className="flex items-center gap-2 text-xs">
                <span className="w-24 shrink-0 opacity-60">{p.period}</span>
                <div className="flex-1 bg-black/5 dark:bg-white/10 rounded h-3">
                  <div
                    className="bg-blue-600 dark:bg-blue-400 h-3 rounded"
                    style={{ width: `${Math.max(p.ratio, 2)}%` }}
                  />
                </div>
                <span className="w-10 text-right opacity-60">{p.ratio.toFixed(0)}</span>
              </div>
            ))}
          </div>
        )}
        {trend && trend.points.length === 0 && (
          <p className="text-xs opacity-50">이 카테고리는 데이터가 없어요.</p>
        )}

        {selectedCategoryCode && (
          <div className="mt-4 border-t border-black/10 dark:border-white/10 pt-3">
            <p className="text-xs opacity-60 mb-2">이 카테고리 안의 세부 키워드 트렌드</p>
            <select
              value={categoryKeyword}
              onChange={(e) => handleCategoryKeywordCheck(e.target.value)}
              className="w-full border border-black/15 dark:border-white/20 rounded px-2 py-1 text-xs bg-transparent mb-2"
            >
              <option value="">키워드 선택...</option>
              {(SHOPPING_KEYWORDS_BY_CATEGORY[selectedCategoryCode] ?? []).map((kw) => (
                <option key={kw} value={kw}>
                  {kw}
                </option>
              ))}
            </select>
            {categoryKeywordLoading && (
              <p className="text-xs opacity-50">불러오는 중...</p>
            )}
            {categoryKeywordError && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {categoryKeywordError}
              </p>
            )}
            {categoryKeywordTrend && categoryKeywordTrend.points.length > 0 && (
              <div className="flex flex-col gap-1">
                {categoryKeywordTrend.points.map((p) => (
                  <div key={p.period} className="flex items-center gap-2 text-xs">
                    <span className="w-24 shrink-0 opacity-60">{p.period}</span>
                    <div className="flex-1 bg-black/5 dark:bg-white/10 rounded h-3">
                      <div
                        className="bg-purple-600 dark:bg-purple-400 h-3 rounded"
                        style={{ width: `${Math.max(p.ratio, 2)}%` }}
                      />
                    </div>
                    <span className="w-10 text-right opacity-60">{p.ratio.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
            {categoryKeywordTrend && categoryKeywordTrend.points.length === 0 && (
              <p className="text-xs opacity-50">이 키워드는 데이터가 없어요.</p>
            )}
          </div>
        )}
      </section>

      <form onSubmit={handleSearch} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="예: 휴대용 선풍기, 화장품, 문구류..."
            className="flex-1 border border-black/15 dark:border-white/20 rounded px-3 py-2 bg-transparent"
          />
          <button
            type="button"
            onClick={handleSearchTrendCheck}
            disabled={searchTrendLoading || !keyword.trim()}
            className="px-3 py-2 rounded border border-black/20 dark:border-white/20 text-xs disabled:opacity-50 shrink-0"
          >
            {searchTrendLoading ? "확인 중..." : "검색어 트렌드"}
          </button>
          <input
            value={hsCode}
            onChange={(e) => setHsCode(e.target.value)}
            placeholder="HS코드 (예: 841451)"
            className="w-48 border border-black/15 dark:border-white/20 rounded px-3 py-2 bg-transparent"
          />
          <button
            type="submit"
            disabled={loading || !hsCode.trim()}
            className="px-4 py-2 rounded bg-foreground text-background text-sm font-medium disabled:opacity-50"
          >
            {loading ? "검색 중..." : "검색"}
          </button>
        </div>

        {hsSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="opacity-60 self-center">추천 HS코드:</span>
            {hsSuggestions.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => {
                  setHsCode(s.code);
                  setKeyword(s.searchTerm);
                }}
                className={`px-2 py-1 rounded border ${
                  hsCode === s.code
                    ? "border-foreground bg-black/5 dark:bg-white/10"
                    : "border-black/15 dark:border-white/20"
                }`}
              >
                {s.label} ({s.code})
              </button>
            ))}
          </div>
        )}

        {recentSearches.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="opacity-60 self-center">최근 검색:</span>
            {recentSearches.map((s, i) => (
              <button
                key={`${s.keyword}-${s.hsCode}-${i}`}
                type="button"
                onClick={() => handleRecentSearchClick(s)}
                className="px-2 py-1 rounded border border-black/15 dark:border-white/20 opacity-80 hover:opacity-100"
              >
                {s.keyword || "(키워드 없음)"} · HS {s.hsCode}
              </button>
            ))}
          </div>
        )}
      </form>

      {searchTrendError && (
        <p className="text-xs text-red-600 dark:text-red-400">{searchTrendError}</p>
      )}
      {searchTrend && (
        <div className="border border-black/10 dark:border-white/10 rounded p-3">
          <p className="text-xs opacity-60 mb-2">
            &ldquo;{searchTrend.title}&rdquo; 네이버 통합검색 트렌드
          </p>
          {searchTrend.points.length > 0 ? (
            <div className="flex flex-col gap-1">
              {searchTrend.points.map((p) => (
                <div key={p.period} className="flex items-center gap-2 text-xs">
                  <span className="w-24 shrink-0 opacity-60">{p.period}</span>
                  <div className="flex-1 bg-black/5 dark:bg-white/10 rounded h-3">
                    <div
                      className="bg-green-600 dark:bg-green-400 h-3 rounded"
                      style={{ width: `${Math.max(p.ratio, 2)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right opacity-60">{p.ratio.toFixed(0)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs opacity-50">이 키워드는 데이터가 없어요.</p>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="border border-black/10 dark:border-white/10 rounded p-4">
            <h2 className="font-semibold mb-1">
              한국의 대일본 수입 통계 (관세청)
            </h2>
            <p className="text-xs opacity-50 mb-3">
              HS코드 {result.tradeSignal.hsCode} · {result.tradeSignal.periodFrom}~
              {result.tradeSignal.periodTo}
            </p>
            <dl className="grid grid-cols-2 gap-y-1 text-sm mb-4">
              <dt className="opacity-60">총 수입액</dt>
              <dd>${result.tradeSignal.totalImportDlr.toLocaleString()}</dd>
              <dt className="opacity-60">총 수입 중량</dt>
              <dd>{result.tradeSignal.totalImportWgt.toLocaleString()} kg</dd>
              <dt className="opacity-60">현재 환율</dt>
              <dd>1엔 = {result.fxRate}원</dd>
            </dl>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs max-h-40 overflow-y-auto">
              {result.tradeSignal.monthly.map((m) => (
                <li key={m.yearMonth} className="opacity-70">
                  {m.yearMonth}: ${m.importDlr.toLocaleString()}
                </li>
              ))}
            </ul>
          </section>

          <section className="border border-black/10 dark:border-white/10 rounded p-4">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="font-semibold">일본 소싱 후보 (라쿠텐)</h2>
              <button
                onClick={() => {
                  setShowManualEntry(true);
                  setSelectedIndex(null);
                  setJapanItem(EMPTY_JAPAN_ITEM);
                }}
                className="text-xs underline opacity-70 hover:opacity-100"
              >
                직접 입력할게요
              </button>
            </div>

            {result.japanCandidates &&
              result.japanCandidates.keyword !== keyword && (
                <p className="text-xs opacity-50 mb-3">
                  검색어 번역: {keyword} → {result.japanCandidates.keyword}
                </p>
              )}

            {result.japanCandidates && result.japanCandidates.items.length > 0 ? (
              <ul className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                {result.japanCandidates.items.map((item, i) => (
                  <li key={i} className="relative">
                    <button
                      onClick={() => handleSelectItem(i)}
                      className={`w-full text-left text-xs rounded border px-3 py-2 pr-14 transition flex gap-3 ${
                        selectedIndex === i
                          ? "border-foreground bg-black/5 dark:bg-white/10"
                          : "border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30"
                      }`}
                    >
                      {item.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="w-14 h-14 object-cover rounded shrink-0"
                        />
                      )}
                      <div>
                        <div className="font-medium line-clamp-2">{item.itemName}</div>
                        <div className="opacity-60 mt-1">
                          {item.shopName} · {item.priceJpy.toLocaleString()}엔 (≈
                          {Math.round(item.priceJpy * (result?.fxRate ?? 0)).toLocaleString()}
                          원) · 리뷰 {item.reviewCount}
                        </div>
                      </div>
                    </button>
                    {item.itemUrl && (
                      <a
                        href={item.itemUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-2 right-2 text-[10px] underline opacity-70 hover:opacity-100 bg-background px-1"
                      >
                        라쿠텐 ↗
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs opacity-50">
                {keyword.trim()
                  ? "검색 결과가 없어요. 다른 키워드로 다시 검색하거나 직접 입력해주세요."
                  : "키워드를 입력하고 검색하면 라쿠텐 후보가 여기 나와요."}
              </p>
            )}

            {showManualEntry && (
              <div className="mt-4 border-t border-black/10 dark:border-white/10 pt-3">
                <div className="grid grid-cols-1 gap-3 text-sm mb-3">
                  <label className="flex flex-col gap-1">
                    상품명
                    <input
                      value={japanItem.itemName}
                      onChange={(e) => updateJapanItem("itemName", e.target.value)}
                      className="border border-black/15 dark:border-white/20 rounded px-2 py-1 bg-transparent"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    판매가 (엔)
                    <input
                      type="number"
                      value={japanItem.priceJpy || ""}
                      onChange={(e) => updateJapanItem("priceJpy", Number(e.target.value))}
                      className="border border-black/15 dark:border-white/20 rounded px-2 py-1 bg-transparent"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    URL
                    <input
                      value={japanItem.itemUrl}
                      onChange={(e) => updateJapanItem("itemUrl", e.target.value)}
                      placeholder="https://..."
                      className="border border-black/15 dark:border-white/20 rounded px-2 py-1 bg-transparent"
                    />
                  </label>
                </div>
                <button
                  onClick={() => result && startMargin(japanItem, result.fxRate)}
                  disabled={!japanItem.itemName.trim() || japanItem.priceJpy <= 0}
                  className="px-4 py-2 rounded border border-black/20 dark:border-white/20 text-sm disabled:opacity-50"
                >
                  마진 계산하기
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {marginInputs && marginResult && (
        <section className="border border-black/10 dark:border-white/10 rounded p-4">
          <div className="flex gap-3 mb-3">
            {japanItem.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={japanItem.imageUrl}
                alt=""
                className="w-16 h-16 object-cover rounded shrink-0"
              />
            )}
            <h2 className="font-semibold self-center">
              마진 계산기 —{" "}
              {japanItem.itemUrl ? (
                <a
                  href={japanItem.itemUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:opacity-80"
                >
                  {japanItem.itemName} ↗
                </a>
              ) : (
                japanItem.itemName
              )}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
            <div className="flex flex-col gap-1">
              상품 원가 (원)
              <div className="border border-transparent px-2 py-1 font-medium">
                {Math.round(marginInputs.priceJpy * marginInputs.fxRate).toLocaleString()}원
                <span className="opacity-50 font-normal">
                  {" "}
                  (환율 1엔={marginInputs.fxRate}원 자동 적용)
                </span>
              </div>
            </div>
            <label className="flex flex-col gap-1">
              국제 배송비 (원)
              <input
                type="number"
                value={marginInputs.shippingKrw}
                onChange={(e) => updateMarginInput("shippingKrw", Number(e.target.value))}
                className="border border-black/15 dark:border-white/20 rounded px-2 py-1 bg-transparent"
              />
            </label>
            <label className="flex flex-col gap-1">
              관세율 (%)
              <input
                type="number"
                value={marginInputs.customsDutyPercent}
                onChange={(e) => updateMarginInput("customsDutyPercent", Number(e.target.value))}
                className="border border-black/15 dark:border-white/20 rounded px-2 py-1 bg-transparent"
              />
            </label>
            <label className="flex flex-col gap-1">
              부가세율 (%)
              <input
                type="number"
                value={marginInputs.vatPercent}
                onChange={(e) => updateMarginInput("vatPercent", Number(e.target.value))}
                className="border border-black/15 dark:border-white/20 rounded px-2 py-1 bg-transparent"
              />
            </label>
            <label className="flex flex-col gap-1">
              플랫폼 수수료율 (%)
              <input
                type="number"
                value={marginInputs.platformFeePercent}
                onChange={(e) => updateMarginInput("platformFeePercent", Number(e.target.value))}
                className="border border-black/15 dark:border-white/20 rounded px-2 py-1 bg-transparent"
              />
            </label>
            <label className="flex flex-col gap-1">
              목표 판매가 (원)
              <input
                type="number"
                value={marginInputs.targetSalePriceKrw}
                onChange={(e) => updateMarginInput("targetSalePriceKrw", Number(e.target.value))}
                className="border border-black/15 dark:border-white/20 rounded px-2 py-1 bg-transparent"
              />
            </label>
          </div>

          <div className="border-t border-black/10 dark:border-white/10 pt-3 mb-4">
            <dl className="grid grid-cols-2 gap-y-1 text-sm mb-3">
              <dt className="opacity-60">관/부가세 반영 원가</dt>
              <dd>{Math.round(marginResult.landedCostKrw).toLocaleString()}원</dd>
            </dl>

            <div
              className={`grid grid-cols-2 gap-4 rounded-lg p-4 ${
                marginResult.marginKrw < 0
                  ? "bg-red-500/10 border border-red-500/30"
                  : "bg-green-500/10 border border-green-500/30"
              }`}
            >
              <div>
                <div className="text-xs opacity-60 mb-1">마진액</div>
                <div
                  className={`text-2xl font-bold ${
                    marginResult.marginKrw < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {marginResult.marginKrw < 0 ? "-" : "+"}
                  {Math.abs(Math.round(marginResult.marginKrw)).toLocaleString()}원
                </div>
              </div>
              <div>
                <div className="text-xs opacity-60 mb-1">마진율</div>
                <div
                  className={`text-2xl font-bold ${
                    marginResult.marginPercent < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {marginResult.marginPercent >= 0 ? "+" : ""}
                  {marginResult.marginPercent.toFixed(1)}%
                </div>
              </div>
            </div>

            {productDescription && (
              <div className="mt-4 text-sm bg-black/5 dark:bg-white/10 rounded p-3">
                <p className="whitespace-pre-wrap mb-2">{productDescription.summaryKo}</p>
                {productDescription.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {productDescription.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="text-xs px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/15"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="px-4 py-2 rounded border border-black/20 dark:border-white/20 text-sm disabled:opacity-50"
            >
              {analyzing ? "분석 중..." : "AI 분석"}
            </button>
            <button
              onClick={handleDescribe}
              disabled={describing}
              className="px-4 py-2 rounded border border-black/20 dark:border-white/20 text-sm disabled:opacity-50"
            >
              {describing ? "설명 생성 중..." : "상품 설명 · 키워드"}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded bg-foreground text-background text-sm disabled:opacity-50"
            >
              {saving ? "저장 중..." : "이 후보 저장"}
            </button>
            {saveMessage && <span className="text-sm self-center opacity-70">{saveMessage}</span>}
          </div>

          {aiComment && (
            <div className="text-sm bg-black/5 dark:bg-white/10 rounded p-3 whitespace-pre-wrap">
              {aiComment}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
