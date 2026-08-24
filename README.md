# 일본 상품 소싱 리서치

한국의 대일본 수입 통계(관세청 기준)로 품목 수요를 확인하고, 일본 오픈마켓(Yahoo! JAPAN 쇼핑 기준)에서
소싱 후보를 찾아 관세·배송비·플랫폼 수수료를 반영한 마진율까지 한 화면에서 리서치하는 도구.
AI(Claude)가 두 데이터를 보고 소싱 경쟁력에 대한 코멘트를 생성한다.

## 데이터 소스 범위 (변경 이력 포함)

공식 API만 사용한다 (스크래핑 없음). 처음엔 네이버 쇼핑 검색 API + 라쿠텐 이치바 API로 시작했지만:

- **네이버 쇼핑 검색 API**: 2026년 7월 31일부로 완전히 종료됨 (공식 대체 API 없음)
- **라쿠텐 이치바 API**: Application ID 발급에 일본 전화번호/주소가 필요해서 가입 불가

그래서 아래 조합으로 전환했다:

- 한국 시장 시그널: **관세청 수출입무역통계 오픈API** (data.go.kr) — HS코드(품목분류코드) 기준 한국↔일본 수출입 실적. 자유 키워드 검색이 아니라서 `lib/hsCodes.ts`에 흔한 소싱 카테고리의 키워드→HS코드 매핑을 큐레이션해뒀다 (완전하지 않으니 필요하면 정확한 HS코드를 직접 입력).
- 일본 소싱 후보: **Yahoo! JAPAN 쇼핑 검색 API** — Yahoo Japan ID를 이메일만으로 만들 수 있어 라쿠텐보다 가입 장벽이 낮음.

## 로컬 실행

```bash
npm install
npm run dev
```

`.env.example`을 참고해서 `.env`에 아래 값을 채워야 정상 동작한다:

- `DATABASE_URL` — Neon Postgres 연결 문자열. Vercel 프로젝트에 Neon 스토리지를 연결하면 대시보드에서 그대로 복사할 수 있고, 로컬 개발도 이 DB(또는 별도 dev 브랜치)에 연결해서 씀
- `TRADE_API_SERVICE_KEY` — [data.go.kr](https://www.data.go.kr) 가입 후 "관세청_품목별 국가별 수출입실적(GW)" 활용신청해서 발급받은 서비스키
- `YAHOO_APP_ID` — [Yahoo! JAPAN Developer Network](https://developer.yahoo.co.jp/register/) 가입(이메일 가능) 후 발급받은 Client ID
- `ANTHROPIC_API_KEY` — [console.anthropic.com](https://console.anthropic.com/) 계정 생성 후 발급

## 스택

Next.js (App Router) + TypeScript + Tailwind, Prisma + Neon Postgres (로컬/배포 동일 DB, `@prisma/adapter-neon`).
