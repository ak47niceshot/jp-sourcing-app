import crypto from "crypto";

export type CoupangProduct = {
  productId: number;
  productName: string;
  productPrice: number;
  productImage: string;
  productUrl: string;
  isRocket: boolean;
  isFreeShipping: boolean;
};

const API_HOST = "https://api-gateway.coupang.com";
const SEARCH_PATH = "/v2/providers/affiliate_open_api/apis/openapi/products/search";

function buildAuthHeader(method: string, pathWithQuery: string): string {
  const accessKey = process.env.COUPANG_ACCESS_KEY;
  const secretKey = process.env.COUPANG_SECRET_KEY;
  if (!accessKey || !secretKey) {
    throw new Error("COUPANG_ACCESS_KEY / COUPANG_SECRET_KEY 환경변수가 설정되지 않았습니다.");
  }

  const [path, query = ""] = pathWithQuery.split("?");
  // 쿠팡 API가 요구하는 서명용 타임스탬프 형식: 연도 2자리 + T + 시분초 + Z (UTC 기준)
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const signedDate =
    `${pad(now.getUTCFullYear() % 100)}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const message = `${signedDate}${method}${path}${query}`;
  const signature = crypto.createHmac("sha256", secretKey).update(message).digest("hex");

  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${signedDate}, signature=${signature}`;
}

/**
 * 쿠팡 파트너스 상품 검색 API — 키워드로 실제 쿠팡 판매 상품을 찾아 진짜 가격/이미지를
 * 가져온다. AI가 웹 검색으로 추측하던 "한국 평균 판매가"와 상품 이미지를 여기서 확보한
 * 실제 데이터로 대체한다.
 *
 * 호출 제한이 시간당 10회로 빡빡해서, 하루 한 번만 도는 AI 소싱 추천(24시간 캐싱)
 * 갱신 시에만 상품 개수만큼(5~6회) 호출하도록 사용해야 한다 — 다른 곳에서 함부로
 * 반복 호출하면 금방 소진된다.
 */
export async function searchCoupangProduct(
  keyword: string
): Promise<CoupangProduct | null> {
  const query = `keyword=${encodeURIComponent(keyword)}&limit=1`;
  const pathWithQuery = `${SEARCH_PATH}?${query}`;

  const res = await fetch(`${API_HOST}${pathWithQuery}`, {
    method: "GET",
    headers: {
      Authorization: buildAuthHeader("GET", pathWithQuery),
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`쿠팡 파트너스 API 요청 실패 (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  const item = data?.data?.productData?.[0];
  if (!item) return null;

  return {
    productId: Number(item.productId) || 0,
    productName: String(item.productName ?? ""),
    productPrice: Number(item.productPrice) || 0,
    productImage: String(item.productImage ?? ""),
    productUrl: String(item.productUrl ?? ""),
    isRocket: Boolean(item.isRocket),
    isFreeShipping: Boolean(item.isFreeShipping),
  };
}
