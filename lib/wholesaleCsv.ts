import Papa from "papaparse";
import iconv from "iconv-lite";

export type ParsedWholesaleRow = {
  productName: string;
  code: string | null;
  wholesalePriceJpy: number;
  referencePriceJpy: number | null;
  raw: Record<string, string>;
};

// 실제 슈퍼딜리버리 CSV 헤더를 아직 확인 못 해서, 흔히 쓰일 만한 헤더 이름
// 후보들로 유연하게 매칭한다. 실제 파일 받으면 이 목록을 맞춰서 조정하면 됨.
const NAME_HEADER_CANDIDATES = ["상품명", "商品名", "품명", "product name", "name"];
const WHOLESALE_PRICE_HEADER_CANDIDATES = [
  "도매단가",
  "도매가",
  "卸単価",
  "卸価格",
  "卸値",
  "wholesale price",
  "wholesale",
];
const REFERENCE_PRICE_HEADER_CANDIDATES = [
  "참고가격",
  "참고가",
  "希望小売価格",
  "参考価格",
  "reference price",
  "msrp",
];
const CODE_HEADER_CANDIDATES = ["sd품번", "sd番号", "품번", "jan", "품목코드", "code", "sku"];

function findHeader(headers: string[], candidates: string[]): string | null {
  const normalized = headers.map((h) => ({ original: h, lower: h.trim().toLowerCase() }));
  for (const candidate of candidates) {
    const match = normalized.find((h) => h.lower === candidate.toLowerCase());
    if (match) return match.original;
  }
  for (const candidate of candidates) {
    const match = normalized.find((h) => h.lower.includes(candidate.toLowerCase()));
    if (match) return match.original;
  }
  return null;
}

function parsePrice(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d.]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function decodeBuffer(buffer: Buffer): string {
  // BOM이 있으면 UTF-8로 간주
  if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.toString("utf8");
  }

  const utf8Text = buffer.toString("utf8");
  const hasReplacementChar = utf8Text.includes("�");
  if (!hasReplacementChar) {
    return utf8Text;
  }

  // UTF-8로 깨지면 일본 CSV에 흔한 Shift-JIS로 재시도
  try {
    return iconv.decode(buffer, "shift_jis");
  } catch {
    return utf8Text;
  }
}

export function parseWholesaleCsv(buffer: Buffer): {
  rows: ParsedWholesaleRow[];
  skipped: number;
  detectedHeaders: { name: string | null; wholesalePrice: string | null };
} {
  const text = decodeBuffer(buffer);
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const headers = parsed.meta.fields ?? [];
  const nameHeader = findHeader(headers, NAME_HEADER_CANDIDATES);
  const wholesaleHeader = findHeader(headers, WHOLESALE_PRICE_HEADER_CANDIDATES);
  const referenceHeader = findHeader(headers, REFERENCE_PRICE_HEADER_CANDIDATES);
  const codeHeader = findHeader(headers, CODE_HEADER_CANDIDATES);

  if (!nameHeader || !wholesaleHeader) {
    throw new Error(
      `CSV에서 상품명/도매가 컬럼을 못 찾았어요. 실제 헤더: ${headers.join(", ") || "(없음)"}`
    );
  }

  let skipped = 0;
  const rows: ParsedWholesaleRow[] = [];

  for (const row of parsed.data) {
    const productName = row[nameHeader]?.trim();
    const wholesalePriceJpy = parsePrice(row[wholesaleHeader]);

    if (!productName || wholesalePriceJpy === null) {
      skipped++;
      continue;
    }

    rows.push({
      productName,
      code: codeHeader ? row[codeHeader]?.trim() || null : null,
      wholesalePriceJpy,
      referencePriceJpy: referenceHeader ? parsePrice(row[referenceHeader]) : null,
      raw: row,
    });
  }

  return {
    rows,
    skipped,
    detectedHeaders: { name: nameHeader, wholesalePrice: wholesaleHeader },
  };
}
