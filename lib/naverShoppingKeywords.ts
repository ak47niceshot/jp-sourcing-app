/**
 * SHOPPING_CATEGORIES(lib/naverShoppingCategories.ts)의 각 대분류 코드 안에서
 * 실제로 검색 데이터가 나오는 걸 확인한 세부 키워드 목록 (2026-08-25, /api/shopping-keyword-trend로
 * 실제 호출해서 points가 비어있지 않은 것만 큐레이션).
 */
export const SHOPPING_KEYWORDS_BY_CATEGORY: Record<string, string[]> = {
  // 화장품/미용 (50000002)
  "50000002": [
    "립스틱",
    "아이섀도",
    "네일",
    "파우더",
    "데오드란트",
    "샴푸",
    "헤어왁스",
    "향수",
    "바디워시",
    "스킨토너",
    "로션",
    "에센스",
    "크림",
    "선크림",
  ],
  // 패션의류 (50000000)
  "50000000": ["남성복", "여성복", "원피스", "티셔츠", "자켓", "니트", "청바지"],
};
