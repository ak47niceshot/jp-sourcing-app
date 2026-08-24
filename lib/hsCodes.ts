export type HsCodeSuggestion = {
  code: string;
  label: string;
  keywords: string[];
};

/**
 * Curated starting set of HS codes (4~6 digit level) for common categories
 * in Japan -> Korea sourcing. Not exhaustive — users can type an exact HS
 * code directly if their product isn't covered here.
 *
 * 관세청 무역통계 API(hsSgn)는 자유 키워드 검색을 지원하지 않아서,
 * 키워드 -> HS코드 매핑을 앱 안에 직접 큐레이션해두었다.
 *
 * 2026-08-24: 실제 API로 전 항목 검증 완료 (당시 국내 인기 HS 코드에서
 * 4개 오류 발견/수정: 문구 482300->4820, 남성의류 620300->6203,
 * 여성의류 620400->6204, 목욕용품 330719->330790). 결과가 총 수입액 $0으로
 * 나오면 코드가 실존하지 않는 분류일 가능성이 높으니 의심해볼 것.
 */
export const HS_CODE_SUGGESTIONS: HsCodeSuggestion[] = [
  { code: "330499", label: "화장품(기초/메이크업)", keywords: ["화장품", "스킨케어", "메이크업", "코스메틱", "cosmetic"] },
  { code: "330300", label: "향수", keywords: ["향수", "perfume"] },
  { code: "4820", label: "문구/종이제품(노트류)", keywords: ["문구", "노트", "다이어리", "종이"] },
  { code: "961000", label: "필기구", keywords: ["필기구", "펜", "볼펜", "샤프"] },
  { code: "950300", label: "완구", keywords: ["완구", "장난감", "toy", "피규어"] },
  { code: "392410", label: "주방용품(플라스틱)", keywords: ["주방용품", "밀폐용기", "도시락", "플라스틱"] },
  { code: "691200", label: "도자기 식기", keywords: ["그릇", "도자기", "식기"] },
  { code: "851660", label: "소형 가전(조리기기)", keywords: ["가전", "조리기기", "전기밥솥", "토스터"] },
  { code: "841451", label: "선풍기", keywords: ["선풍기", "휴대용 선풍기", "fan"] },
  { code: "6203", label: "남성 의류", keywords: ["남성복", "남성 의류"] },
  { code: "6204", label: "여성 의류", keywords: ["여성복", "여성 의류"] },
  { code: "640399", label: "신발", keywords: ["신발", "슈즈", "운동화"] },
  { code: "420292", label: "가방/파우치", keywords: ["가방", "파우치", "백팩"] },
  { code: "330790", label: "목욕/바디 용품", keywords: ["목욕용품", "바디워시", "입욕제"] },
  { code: "902000", label: "마스크/위생용품", keywords: ["마스크", "위생용품"] },
  { code: "190590", label: "과자/스낵", keywords: ["과자", "스낵", "간식"] },
  { code: "210690", label: "건강기능식품/보조제", keywords: ["건강기능식품", "영양제", "보조제", "supplement"] },
  { code: "852872", label: "소형 디스플레이/모니터", keywords: ["모니터", "디스플레이"] },
  { code: "851830", label: "이어폰/헤드폰", keywords: ["이어폰", "헤드폰", "이어버드"] },
  { code: "392690", label: "생활잡화(플라스틱 기타)", keywords: ["생활잡화", "잡화"] },
];

export function suggestHsCodes(keyword: string): HsCodeSuggestion[] {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return [];

  return HS_CODE_SUGGESTIONS.filter((entry) =>
    entry.keywords.some(
      (kw) =>
        normalized.includes(kw.toLowerCase()) || kw.toLowerCase().includes(normalized)
    )
  );
}
