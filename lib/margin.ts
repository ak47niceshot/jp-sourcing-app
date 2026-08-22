export type MarginInputs = {
  /** 일본 판매가 (JPY) */
  priceJpy: number;
  /** JPY -> KRW 환율 (1 JPY = ? KRW) */
  fxRate: number;
  /** 국제 배송비 (KRW) */
  shippingKrw: number;
  /** 관세율 (%, 0~100) */
  customsDutyPercent: number;
  /** 부가세율 (%, 0~100, 기본 10) */
  vatPercent: number;
  /** 국내 판매 플랫폼 수수료율 (%, 0~100) */
  platformFeePercent: number;
  /** 목표 국내 판매가 (KRW) */
  targetSalePriceKrw: number;
};

export type MarginResult = {
  /** 원가를 KRW로 환산한 값 */
  costKrw: number;
  /** 원가 + 배송비에 관세/부가세를 적용한 총 원가 */
  landedCostKrw: number;
  /** 플랫폼 수수료 (KRW) */
  platformFeeKrw: number;
  /** 마진액 (KRW) */
  marginKrw: number;
  /** 마진율 (%, 목표판매가 대비) */
  marginPercent: number;
};

export function calculateMargin(inputs: MarginInputs): MarginResult {
  const costKrw = inputs.priceJpy * inputs.fxRate;
  const dutyAndVatMultiplier =
    1 + inputs.customsDutyPercent / 100 + inputs.vatPercent / 100;
  const landedCostKrw =
    (costKrw + inputs.shippingKrw) * dutyAndVatMultiplier;
  const platformFeeKrw =
    inputs.targetSalePriceKrw * (inputs.platformFeePercent / 100);
  const marginKrw = inputs.targetSalePriceKrw - landedCostKrw - platformFeeKrw;
  const marginPercent =
    inputs.targetSalePriceKrw > 0
      ? (marginKrw / inputs.targetSalePriceKrw) * 100
      : 0;

  return {
    costKrw,
    landedCostKrw,
    platformFeeKrw,
    marginKrw,
    marginPercent,
  };
}
