# 일본 상품 소싱 리서치

한국 오픈마켓(네이버 쇼핑 기준)에서 경쟁 상황을 확인하고, 일본 오픈마켓(라쿠텐 기준)에서
소싱 후보를 찾아 관세·배송비·플랫폼 수수료를 반영한 마진율까지 한 화면에서 리서치하는 도구.
AI(Claude)가 두 시장 데이터를 보고 소싱 경쟁력에 대한 코멘트를 생성한다.

## 데이터 소스 범위

공식 API만 사용한다 (스크래핑 없음). 그래서 현재는:

- 한국 시장 시그널: **네이버 쇼핑 검색 API**만 사용 (쿠팡/지마켓/11번가는 외부 개발자용 판매량 API가 없음)
- 일본 소싱 후보: **라쿠텐 이치바 API**만 사용 (아마존재팬은 어소시에이트 매출 실적이 있어야 PA-API 승인이 나서 제외, 큐텐은 공개 API 없음)

## 로컬 실행

```bash
npm install
npm run dev
```

`.env.example`을 참고해서 `.env`에 아래 값을 채워야 정상 동작한다:

- `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` — [developers.naver.com](https://developers.naver.com/apps) 애플리케이션 등록 (쇼핑 API 사용 설정) 후 발급
- `RAKUTEN_APP_ID` — [webservice.rakuten.co.jp](https://webservice.rakuten.co.jp/) 가입 후 발급
- `ANTHROPIC_API_KEY` — [console.anthropic.com](https://console.anthropic.com/) 계정 생성 후 발급

## 스택

Next.js (App Router) + TypeScript + Tailwind, Prisma(SQLite 로컬 / Postgres 배포 예정).
