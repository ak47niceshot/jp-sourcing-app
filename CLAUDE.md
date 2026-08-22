@AGENTS.md

## Working notes for this project

- The owner has no coding background and relies on Claude to handle git/GitHub and infra steps directly.
- Never commit straight to `main` — use a feature branch and open a PR (initial scaffold commit is the one exception).
- Explain steps in plain language; don't assume git/GitHub/Next.js familiarity.
- Data sources are limited to official APIs only (Naver Shopping Search API, Rakuten Ichiba API) — no scraping. See `lib/naver.ts` and `lib/rakuten.ts` for why other marketplaces (Coupang, Gmarket, 11st, Amazon Japan, Qoo10) are out of scope for now.
- AI analysis (`lib/analyze.ts`) calls the Anthropic API directly and requires `ANTHROPIC_API_KEY`.
- Local dev uses SQLite via a Prisma driver adapter (`@prisma/adapter-better-sqlite3`); production deploy will swap to Postgres (Neon via Vercel) — same schema, different adapter/connection string.
