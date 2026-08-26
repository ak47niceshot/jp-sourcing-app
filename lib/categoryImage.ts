// AI 소싱 추천은 이 목록 중 하나로 카테고리를 고정해서 받는다(자유 텍스트였을 때
// 키워드 매칭이 계속 어긋나서 이미지가 엉뚱하게 붙는 문제가 있었음). 정확한 상품
// 사진은 아직 못 붙이고(Rakuten 미연동 — lib/rakuten.ts 참고) 카테고리 대표 사진으로 대체한다.
// 식품은 건마다 수입식품안전관리 특별법상 수입신고·검사 대상이라 "바로 통관해서
// 바로 판매" 조건과 안 맞아서 추천 카테고리에서 뺐다(2026-08-26). food.jpg는 혹시
// 몰라 남겨두지만 지금은 어떤 카테고리도 이 파일을 가리키지 않는다.
export const SOURCING_CATEGORIES = [
  "패션의류",
  "화장품/뷰티",
  "잡화/액세서리",
  "생활/리빙",
  "전자/디지털",
  "기타",
] as const;

export type SourcingCategory = (typeof SOURCING_CATEGORIES)[number];

const CATEGORY_IMAGE_FILE: Record<SourcingCategory, string> = {
  "패션의류": "fashion",
  "화장품/뷰티": "beauty",
  "잡화/액세서리": "goods",
  "생활/리빙": "living",
  "전자/디지털": "electronics",
  "기타": "default",
};

export function getCategoryImage(category: string): string {
  const file = CATEGORY_IMAGE_FILE[category as SourcingCategory] ?? "default";
  return `/images/categories/${file}.jpg`;
}
