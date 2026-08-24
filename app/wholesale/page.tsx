"use client";

import { useEffect, useState } from "react";
import { calculateMargin, MarginInputs, MarginResult } from "@/lib/margin";

type WholesaleItem = {
  id: number;
  source: string;
  productName: string;
  code: string | null;
  wholesalePriceJpy: number;
  referencePriceJpy: number | null;
  uploadedAt: string;
};

const DEFAULT_MARGIN_INPUTS: Omit<MarginInputs, "priceJpy" | "fxRate"> = {
  shippingKrw: 5000,
  customsDutyPercent: 8,
  vatPercent: 10,
  platformFeePercent: 10,
  targetSalePriceKrw: 0,
};

export default function WholesalePage() {
  const [items, setItems] = useState<WholesaleItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [source, setSource] = useState("슈퍼딜리버리");
  const [fxRate, setFxRate] = useState<number | null>(null);

  const [selected, setSelected] = useState<WholesaleItem | null>(null);
  const [marginInputs, setMarginInputs] = useState<MarginInputs | null>(null);

  const marginResult: MarginResult | null = marginInputs
    ? calculateMargin(marginInputs)
    : null;

  async function loadItems(searchKeyword: string) {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/wholesale", window.location.origin);
      if (searchKeyword) url.searchParams.set("keyword", searchKeyword);
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "조회 실패");
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems("");
    fetch("/api/fx")
      .then((res) => res.json())
      .then((data) => setFxRate(data.fxRate))
      .catch(() => setFxRate(9.5));
  }, []);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("source", source);

    try {
      const res = await fetch("/api/wholesale/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "업로드 실패");
      setUploadMessage(
        `${data.imported}개 상품 추가됨 (건너뜀 ${data.skipped}개) — 인식된 컬럼: 상품명="${data.detectedHeaders.name}", 도매가="${data.detectedHeaders.wholesalePrice}"`
      );
      form.reset();
      loadItems(keyword);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setUploading(false);
    }
  }

  function handleSelect(item: WholesaleItem) {
    if (!fxRate) return;
    setSelected(item);
    const costKrw = item.wholesalePriceJpy * fxRate;
    const landedCostKrw =
      (costKrw + DEFAULT_MARGIN_INPUTS.shippingKrw) *
      (1 +
        DEFAULT_MARGIN_INPUTS.customsDutyPercent / 100 +
        DEFAULT_MARGIN_INPUTS.vatPercent / 100);
    const TARGET_MARGIN_PERCENT = 20;
    const denominator =
      1 - DEFAULT_MARGIN_INPUTS.platformFeePercent / 100 - TARGET_MARGIN_PERCENT / 100;

    setMarginInputs({
      priceJpy: item.wholesalePriceJpy,
      fxRate,
      ...DEFAULT_MARGIN_INPUTS,
      targetSalePriceKrw: Math.round(landedCostKrw / denominator),
    });
  }

  function updateMarginInput(key: keyof MarginInputs, value: number) {
    setMarginInputs((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold mb-2">도매 상품</h1>
        <p className="text-sm opacity-70">
          라쿠텐은 소매가라 가격 경쟁력에 한계가 있어요. 슈퍼딜리버리 같은 도매
          사이트는 공식 API가 없어서, 승인받은 공급사의 상품을 공식{" "}
          <strong>&quot;상품정보 다운로드&quot;</strong> 기능으로 CSV로 받아 여기에
          업로드하면, 도매가 기준으로 마진을 계산할 수 있어요.
        </p>
      </div>

      <form
        onSubmit={handleUpload}
        className="border border-black/10 dark:border-white/10 rounded p-4 flex flex-col gap-3"
      >
        <h2 className="font-semibold">CSV 업로드</h2>
        <div className="flex flex-wrap items-end gap-3 text-sm">
          <label className="flex flex-col gap-1">
            출처
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="border border-black/15 dark:border-white/20 rounded px-2 py-1 bg-transparent"
            />
          </label>
          <label className="flex flex-col gap-1">
            CSV 파일
            <input
              type="file"
              name="file"
              accept=".csv,text/csv"
              className="text-xs"
            />
          </label>
          <button
            type="submit"
            disabled={uploading}
            className="px-4 py-2 rounded bg-foreground text-background text-sm font-medium disabled:opacity-50"
          >
            {uploading ? "업로드 중..." : "업로드"}
          </button>
        </div>
        {uploadMessage && <p className="text-xs opacity-70">{uploadMessage}</p>}
        <p className="text-xs opacity-50">
          CSV 헤더 이름을 &quot;상품명&quot;, &quot;도매단가&quot; 등으로 자동
          인식하려 시도해요. 실제 파일 헤더가 다르면 알려주세요 — 인식 규칙을
          맞춰드릴게요.
        </p>
      </form>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadItems(keyword)}
          placeholder="업로드한 상품 검색 (일본어/한국어 상관없이 원문 그대로 검색)"
          className="flex-1 border border-black/15 dark:border-white/20 rounded px-3 py-2 bg-transparent"
        />
        <button
          onClick={() => loadItems(keyword)}
          disabled={loading}
          className="px-4 py-2 rounded border border-black/20 dark:border-white/20 text-sm disabled:opacity-50"
        >
          {loading ? "검색 중..." : "검색"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="border border-black/10 dark:border-white/10 rounded p-4">
          <h2 className="font-semibold mb-3">업로드된 도매 상품 ({items.length})</h2>
          {items.length === 0 ? (
            <p className="text-xs opacity-50">
              아직 업로드한 상품이 없어요. 위에서 CSV를 업로드해주세요.
            </p>
          ) : (
            <ul className="flex flex-col gap-2 max-h-96 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left text-xs rounded border px-3 py-2 transition ${
                      selected?.id === item.id
                        ? "border-foreground bg-black/5 dark:bg-white/10"
                        : "border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30"
                    }`}
                  >
                    <div className="font-medium line-clamp-2">{item.productName}</div>
                    <div className="opacity-60 mt-1">
                      {item.source} · 도매 {item.wholesalePriceJpy.toLocaleString()}엔
                      {fxRate &&
                        ` (≈${Math.round(item.wholesalePriceJpy * fxRate).toLocaleString()}원)`}
                      {item.referencePriceJpy &&
                        ` · 참고가 ${item.referencePriceJpy.toLocaleString()}엔`}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {marginInputs && marginResult && selected && (
          <section className="border border-black/10 dark:border-white/10 rounded p-4">
            <h2 className="font-semibold mb-3">마진 계산기 — {selected.productName}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div className="flex flex-col gap-1">
                도매 원가 (원)
                <div className="px-2 py-1 font-medium">
                  {Math.round(marginInputs.priceJpy * marginInputs.fxRate).toLocaleString()}원
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
          </section>
        )}
      </div>
    </div>
  );
}
