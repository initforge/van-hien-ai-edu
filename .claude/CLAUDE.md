# Văn Học AI — Claude Code Conventions

## Stack
- Front: React 19 + Vite + Tailwind CSS v4
- Backend: Cloudflare Pages Functions (ES modules)
- DB: Cloudflare D1 (SQLite)
- Auth: JWT via `jose` (24h expiry, HttpOnly cookie)
- Data Fetching: SWR
- KV: Cloudflare Workers KV (rate limit + cache)

## Structure

```
src/
  pages/
    Homepage.tsx / LoginPage.tsx / AdminLoginPage.tsx
    student/     — StudentDashboard, ExamDetail, CharacterChat, Multiverse, Results, Profile, StudentExamRoom
    teacher/     — TeacherDashboard, Library, ExamBank, Grading, Characters, AIReview, TeacherMultiverse
    admin/       — AdminDashboard, AdminUsers, AdminClasses, AdminLogs
  components/
    layout/      — StudentLayout, TeacherLayout, AdminLayout, Sidebars
    ErrorBoundary.tsx
  lib/           — fetcher.ts (SWR fetcher + formatDate), utils.ts (formatTimeAgo, formatLogTime, FILL_SETTINGS, status constants)
  contexts/      — AuthContext.tsx (JWT auth + ProtectedRoute)

functions/api/  — Cloudflare Pages Functions (_middleware, _cache, _rateLimit, auth, me, chat, works, exams, submissions, classes, storylines, stats, hello, answers, characters, exam-detail, admin/users, admin/classes, admin/stats, admin/logs)

database/
  schema/       — D1 migrations 001-018 + 999-indexes.sql
  seed/         — Seed data 001-008

db.legacy/      — Legacy flat files (DO NOT USE — kept for reference only)
```

## Conventions

- **TypeScript**: use explicit types, avoid `any`
- **SWR**: `data ?? []` for loading states, always handle `error` state
- **Auth**: JWT in HttpOnly cookie, verified by `_middleware.js`
- **API**: parameterized SQL only (no string concatenation)
- **State**: functional `setState(prev => ...)` for derived updates
- **Streaming**: use `ReadableStream` + `TextEncoder` for AI responses

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # Production build
```

## Deploy
```
Frontend: npx wrangler pages deploy dist/

Backend (Functions): auto-deployed via Cloudflare Pages Git integration
Secrets: npx wrangler secret put JWT_SECRET

KV (prod):  npx wrangler kv:namespace create VANHIEN_KV --env production
D1 (prod):  npx wrangler d1 create vanhien-db --env production
→ paste IDs into wrangler.prod.toml before deploy
```

## Tech Debt

| # | File | Issue | Priority | Status |
|---|------|-------|----------|--------|
| 1 | chat.js | characterId from client, no allowlist (MVP stub) | P1 | Known |
| 2 | logout (auth.js) | No server-side token revocation — revokeToken() ready in _kv.js, needs integration | P2 | Pending |
| 3 | submissions.js:67 | SQL injection in batch INSERT (JSON.stringify in template) | P0 | **FIXED** — parameterized |
| 4 | chat.js:56 | N+1 DB INSERT every 8 words during streaming | P0 | Pending |
| 5 | classes.js:3 | GET /api/classes missing auth check | P1 | Pending |
| 6 | 7 list endpoints | No pagination — unbounded result sets | P1 | Pending |
| 7 | stats.js:54, submissions.js:21 | 5xx responses cached with profile:'dynamic' | P1 | **FIXED** — nocache |
| 8 | 8 src files | ~42 `: any` usages — TypeScript errors | P1 | **FIXED** — src/types/api.ts |
| 9 | ExamDetail.tsx | Empty catch + missing useSWR import | P1 | **FIXED** |

## Recent Changes

- 2026-03-31: Full review — TypeScript strict mode enabled; 60 TS errors fixed; SQL injection P0 patched; alert/confirm replaced with modal dialogs; submissions.js 500 cache fixed; SWR type generics corrected
- 2026-03-30: Full review A→Z — 28 audit findings (P0:4, P1:12, P2:12); 15+ safe fixes applied; ErrorBoundary wired; unused dep removed; .env.example + .gitignore fixed; REUSE-1/2/3/5/7 fixed; ExamRoomPage.tsx + empty ui/ deleted; src/lib/utils.ts created

## Skills Usage

→ `~/.claude/skills/SKILL.md`

### Lệnh cho dự án này
- `/full-review` — Chạy A→Z: audit → cleanup → module-refactor → setup-db → README
- `/cleanup` — Dọn rác
- `/audit` — Audit phần sẽ đụng đến
- `/module-refactor` — Chỉ khi file > 500d hoặc god file cần sửa
