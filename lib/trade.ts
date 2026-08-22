export type TradeSignal = {
  hsCode: string;
  periodFrom: string;
  periodTo: string;
  /** 한국의 대일본 수입 총 금액 (달러) */
  totalImportDlr: number;
  /** 한국의 대일본 수입 총 중량 (kg) */
  totalImportWgt: number;
  monthly: {
    yearMonth: string;
    importDlr: number;
    importWgt: number;
    exportDlr: number;
  }[];
};

function yyyymm(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}

/**
 * 관세청 수출입무역통계 Open API (공공데이터포털) — 품목(HS코드)별, 국가별
 * 실적을 조회. 최근 12개월(대략) 구간의 한국<->일본 수입 통계를 집계해서 반환.
 * https://www.data.go.kr/data/15100475/openapi.do
 */
export async function fetchKoreaJapanTradeSignal(
  hsCode: string
): Promise<TradeSignal> {
  const serviceKey = process.env.TRADE_API_SERVICE_KEY;
  if (!serviceKey) {
    throw new Error("TRADE_API_SERVICE_KEY 환경변수가 설정되지 않았습니다.");
  }

  const now = new Date();
  // 관세청 통계는 최신 1~2개월은 잠정치라 안전하게 2개월 전까지, 12개월 구간으로 조회
  const end = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const start = new Date(now.getFullYear(), now.getMonth() - 13, 1);

  const url = new URL(
    "https://apis.data.go.kr/1220000/nitemtrade/getNitemtradeList"
  );
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("strtYymm", yyyymm(start));
  url.searchParams.set("endYymm", yyyymm(end));
  url.searchParams.set("cntyCd", "JP");
  url.searchParams.set("hsSgn", hsCode);
  url.searchParams.set("numOfRows", "50");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`관세청 무역통계 API 요청 실패 (${res.status}): ${body}`);
  }

  // 이 API는 type=json을 무시하고 항상 XML을 반환한다.
  const xml = await res.text();

  const resultCode = xml.match(/<resultCode>([^<]*)<\/resultCode>/)?.[1];
  if (resultCode && resultCode !== "00") {
    const resultMsg = xml.match(/<resultMsg>([^<]*)<\/resultMsg>/)?.[1];
    throw new Error(`관세청 무역통계 API 오류 (${resultCode}): ${resultMsg ?? xml}`);
  }

  function tag(block: string, name: string): string {
    return block.match(new RegExp(`<${name}>([^<]*)</${name}>`))?.[1] ?? "";
  }

  const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(
    (m) => m[1]
  );

  const monthly = itemBlocks
    .filter((block) => tag(block, "statCd") === "JP")
    .map((block) => ({
      yearMonth: tag(block, "year"),
      importDlr: Number(tag(block, "impDlr")) || 0,
      importWgt: Number(tag(block, "impWgt")) || 0,
      exportDlr: Number(tag(block, "expDlr")) || 0,
    }))
    .sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));

  return {
    hsCode,
    periodFrom: yyyymm(start),
    periodTo: yyyymm(end),
    totalImportDlr: monthly.reduce((sum, m) => sum + m.importDlr, 0),
    totalImportWgt: monthly.reduce((sum, m) => sum + m.importWgt, 0),
    monthly,
  };
}
