// AI에게 이미지 URL을 그대로 물어보면 자주 지어내거나(할루시네이션) 못 찾겠다며
// null을 준다. 대신 AI가 실제로 방문한 상품 페이지 URL만 받아서, 그 페이지의
// og:image 메타 태그를 직접 읽어온다 — 대부분의 쇼핑몰이 SNS 공유 미리보기용으로
// 이 태그를 붙여놓기 때문에 훨씬 안정적으로 진짜 상품 사진을 얻을 수 있다.
export async function fetchOgImage(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(pageUrl, {
      signal: AbortSignal.timeout(6000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
    });
    if (!res.ok) return null;

    const html = await res.text();
    const match =
      html.match(
        /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i
      ) ??
      html.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i
      ) ??
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (!match) return null;

    const resolved = new URL(match[1], pageUrl).toString();
    return resolved.startsWith("https://") || resolved.startsWith("http://")
      ? resolved
      : null;
  } catch {
    return null;
  }
}
