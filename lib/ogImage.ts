// AI에게 이미지 URL을 그대로 물어보면 자주 지어내거나(할루시네이션) 못 찾겠다며
// null을 준다. 대신 AI가 실제로 방문한 상품 페이지 URL만 받아서, 그 페이지 안의
// 상품 이미지 메타데이터를 직접 읽어온다 — 대부분의 쇼핑몰이 SNS 공유 미리보기나
// 검색엔진 리치스니펫용으로 이런 태그를 붙여놓기 때문에 안정적으로 진짜 상품
// 사진을 얻을 수 있다. 사이트마다 마크업이 달라서 여러 방식을 순서대로 시도한다.
const EXTRACTORS: RegExp[] = [
  /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
  /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
  /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
  /"image"\s*:\s*"([^"]+\.(?:jpg|jpeg|png|webp))"/i, // schema.org JSON-LD Product
];

async function fetchImageFromPage(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(pageUrl, {
      signal: AbortSignal.timeout(6000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Accept: "text/html",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) return null;

    const html = await res.text();
    for (const pattern of EXTRACTORS) {
      const match = html.match(pattern);
      if (!match) continue;
      const resolved = new URL(match[1], pageUrl).toString();
      if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
        return resolved;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// 첫 후보 URL이 막히거나(403 등) 이미지 태그를 못 찾으면 다음 후보로 넘어간다.
export async function fetchOgImage(pageUrls: string[]): Promise<string | null> {
  for (const url of pageUrls) {
    const image = await fetchImageFromPage(url);
    if (image) return image;
  }
  return null;
}
