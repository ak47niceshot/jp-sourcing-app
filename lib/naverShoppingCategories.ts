export type ShoppingCategory = {
  code: string;
  label: string;
};

/**
 * 네이버 쇼핑인사이트 분야 코드 큐레이션 목록.
 *
 * 공식 코드표가 따로 없고, 네이버쇼핑(shopping.naver.com)에서 카테고리 클릭 시
 * URL의 cat_id 파라미터 값으로 확인하는 방식 — lib/hsCodes.ts와 같은 방식으로,
 * 실제 확인된 값만 추가한다.
 *
 * 2026-08-25: "패션의류", "화장품/미용"은 NAVER API HUB 공식 개발 가이드의 요청 예시 코드에
 * 나온 값 — 실제 API 호출로 데이터 나오는 것까지 확인함(검증됨).
 *
 * search.shopping.naver.com/ns/category/{catId} (새 쇼핑 UI, "ns" 경로) 형태의 URL에서
 * 가져온 하위 카테고리 코드(스킨토너/로션/에센스/크림 등)는 실제로 호출해보니 전부 빈 데이터가
 * 나왔다 — 쇼핑인사이트 API가 쓰는 코드 체계와 다른 것으로 보인다. 이 방식으로는 코드를
 * 추가하지 말 것. 새 카테고리를 추가할 땐 반드시 /api/trend로 실제 호출해서 points가
 * 비어있지 않은지 확인 후 추가한다.
 */
export const SHOPPING_CATEGORIES: ShoppingCategory[] = [
  { code: "50000000", label: "패션의류" },
  { code: "50000002", label: "화장품/미용" },
];
