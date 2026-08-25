// AI 소싱 추천은 매번 다른 자유 텍스트 카테고리를 반환하므로, 정확한 상품 사진 대신
// 카테고리를 큰 버킷으로 분류해서 미리 준비해둔 대표 이미지를 보여준다.
// (Rakuten 연동 전이라 실제 상품 이미지를 바로 가져올 수 없음 — lib/rakuten.ts 참고)
const CATEGORY_IMAGE_RULES: { keywords: string[]; file: string }[] = [
  { keywords: ["화장품", "뷰티", "스킨", "코스메틱", "미용", "향수", "샴푸", "바디"], file: "beauty" },
  { keywords: ["패션", "의류", "옷", "니트", "티셔츠", "자켓", "청바지", "원피스", "신발"], file: "fashion" },
  { keywords: ["가방", "지갑", "액세서리", "쥬얼리", "잡화", "시계"], file: "goods" },
  { keywords: ["생활", "리빙", "주방", "가전", "인테리어", "청소", "욕실"], file: "living" },
  { keywords: ["전자", "디지털", "가젯", "이어폰", "헤드폰", "충전", "케이블", "무선"], file: "electronics" },
  { keywords: ["식품", "간식", "음료", "과자", "차", "커피"], file: "food" },
];

export function getCategoryImage(category: string): string {
  const match = CATEGORY_IMAGE_RULES.find((rule) =>
    rule.keywords.some((kw) => category.includes(kw))
  );
  return `/images/categories/${match ? match.file : "default"}.jpg`;
}
