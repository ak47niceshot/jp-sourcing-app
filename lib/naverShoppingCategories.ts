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
 * 나온 값(검증됨). 화장품/미용 하위 항목들은 search.shopping.naver.com/ns/category/{catId}
 * URL에서 직접 확인한 값. 나머지 대분류는 필요할 때마다 같은 방식으로 추가 예정.
 */
export const SHOPPING_CATEGORIES: ShoppingCategory[] = [
  { code: "50000000", label: "패션의류" },
  { code: "50000002", label: "화장품/미용" },
  { code: "10002145", label: "└ 스킨토너" },
  { code: "10002146", label: "└ 로션" },
  { code: "10002147", label: "└ 에센스" },
  { code: "10002148", label: "└ 크림" },
];
