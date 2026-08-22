/**
 * JPY -> KRW exchange rate via frankfurter.app (free, no API key required).
 * Falls back to a rough hardcoded rate if the request fails, so the UI
 * always has an editable starting value.
 */
export async function fetchJpyToKrwRate(): Promise<number> {
  const FALLBACK_RATE = 9.5;

  try {
    const url = new URL("https://api.frankfurter.app/latest");
    url.searchParams.set("from", "JPY");
    url.searchParams.set("to", "KRW");

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return FALLBACK_RATE;

    const data = await res.json();
    const rate = data?.rates?.KRW;
    return typeof rate === "number" && rate > 0 ? rate : FALLBACK_RATE;
  } catch {
    return FALLBACK_RATE;
  }
}
