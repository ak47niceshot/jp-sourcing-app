@AGENTS.md

## Working notes for this project

- The owner has no coding background and relies on Claude to handle git/GitHub and infra steps directly.
- Never commit straight to `main` — use a feature branch and open a PR (initial scaffold commit is the one exception).
- Explain steps in plain language; don't assume git/GitHub/Next.js familiarity.
- Data sources are limited to official APIs only — no scraping. Korea side: 관세청 수출입무역통계 API (`lib/trade.ts`, HS코드 기준, keyword가 아님 — `lib/hsCodes.ts`에 큐레이션된 키워드→HS코드 매핑 사용). Japan side: Yahoo! JAPAN Shopping API (`lib/yahoo.ts`). Naver Shopping Search API was tried first but is fully discontinued (종료 2026-07-31, no replacement); Rakuten was tried but its Application ID registration requires a Japanese phone number/address, which blocked the user.
- AI analysis (`lib/analyze.ts`) calls the Anthropic API directly and requires `ANTHROPIC_API_KEY`.
- DB is Neon Postgres via a Prisma driver adapter (`@prisma/adapter-neon`, `lib/prisma.ts`) — same DB for local dev and Vercel production, no more local SQLite. `DATABASE_URL` must be a Postgres connection string. `npm run build` runs `prisma migrate deploy` first, so Vercel applies pending migrations on every deploy automatically.
