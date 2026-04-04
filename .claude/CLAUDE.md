# Van Hoc AI — Claude Code Conventions

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
    teacher/     — TeacherDashboard, Library, ExamBank, Grading, Characters, AIReview, TeacherMultiverse, ClassManagement
    admin/       — AdminDashboard, AdminUsers, AdminClasses, AdminLogs
  components/
    layout/      — StudentLayout, TeacherLayout, AdminLayout, Sidebars
    ErrorBoundary.tsx
  lib/           — fetcher.ts (SWR fetcher), utils.ts (formatTimeAgo, formatLogTime, formatDate, FILL_SETTINGS, status constants)
  contexts/      — AuthContext.tsx (JWT auth + ProtectedRoute)
  types/         — api.ts (shared TypeScript interfaces)

functions/api/  — Cloudflare Pages Functions (_middleware, _cache, _rateLimit, auth, me, chat, works, exams, submissions, classes, storylines, stats, hello, answers, characters, exam-detail, admin/, teacher/, ai/, warnings/)
  _utils.js      — jsonError, estimateTokens, parseAiJson

database/
  schema/       — 01-users, 02-classes, 03-works, 04-grading, 05-exams, 06-activity, _teardown.sql
  seed/         — 001-accounts, 002-passwords, 003-rubric

# Deploy Database (clean rebuild)
npx wrangler d1 execute vanhien-db --remote --file=database/schema/_teardown.sql
npx wrangler d1 execute vanhien-db --remote --file=database/schema/01-users.sql
npx wrangler d1 execute vanhien-db --remote --file=database/schema/02-classes.sql
npx wrangler d1 execute vanhien-db --remote --file=database/schema/03-works.sql
npx wrangler d1 execute vanhien-db --remote --file=database/schema/04-grading.sql
npx wrangler d1 execute vanhien-db --remote --file=database/schema/05-exams.sql
npx wrangler d1 execute vanhien-db --remote --file=database/schema/06-activity.sql
npx wrangler d1 execute vanhien-db --remote --file=database/seed/001-accounts.sql
npx wrangler d1 execute vanhien-db --remote --file=database/seed/002-passwords.sql
npx wrangler d1 execute vanhien-db --remote --file=database/seed/003-rubric.sql

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
| 2 | logout (auth.js) | No server-side token revocation — revokeToken() ready in _kv.js, needs integration | P2 | **FIXED** |
| 3 | submissions.js | SQL injection in batch INSERT | P0 | **FIXED** |
| 4 | chat.js:56 | N+1 DB INSERT every 8 words during streaming | P0 | **FIXED** — fullTextPromise (persist after stream complete) |
| 5 | classes.js | ~~GET /api/classes missing auth~~ | P1 | **FIXED** |
| 6 | 7 list endpoints | No pagination — unbounded result sets | P1 | **FIXED** — all list endpoints now have LIMIT/OFFSET |
| 7 | stats.js, submissions.js | 5xx responses cached with profile:'dynamic' | P1 | **FIXED** |
| 8 | src files | ~42 `: any` usages | P1 | **FIXED** — reduced to ~4 remaining |
| 9 | ExamDetail.tsx | Empty catch + missing useSWR import | P1 | **FIXED** |
| 10 | works.js:79 | Always evaluates 'pending' (status never 'none') | P0 | **FIXED** |
| 11 | teacher/stats-ai.js:74 | Wrong property `r.outputTokens` (should be `r.totalOutput`) | P1 | **FIXED** |
| 12 | multiverse.js:144 | JSON.parse without try/catch | P1 | **FIXED** |
| 13 | admin/classes.js | Orphaned submissions/questions on class delete | P1 | **FIXED** |
| 14 | activity.js | 4 syntax errors (missing `)`, comma) — would crash runtime | P0 | **FIXED** |
| 15 | warnings.js | 3 syntax errors (missing `)`, wrong table name `ai_wwords`) | P0 | **FIXED** |
| 16 | works/[id]/*.js | Wrong import paths (`../../../api/_cache.js` → `../../_cache.js`) | P0 | **FIXED** |
| 17 | 03-works.sql, characters.js, chat.js, ai-multiverse.js | `works.status` redundant with `analysis_status` — students permanently locked from characters/chat/multiverse | P0 | **FIXED** — dropped `status` column; all AI gates now use `analysis_status = 'done'` |
| 18 | Grading.tsx | Fetches ALL submissions/exams then filters client-side — should send `classId`/`examId` to API | P1 | **FIXED** — wired to `?examId=` on submissions.js and `?classId=` on exams.js |
| 19 | ExamBank.tsx | Class dropdown only filters client-side — should send `?classId=` to API | P1 | **FIXED** — wired to `/api/exams?classId=` |
| 20 | TeacherMultiverse.tsx | Fetches `/api/storylines` without teacher_id filter — may show other teachers' data | P1 | **FIXED** — now uses `/api/teacher/storylines` with teacher ownership |
| 21 | AIReview.tsx | `student_stats` tab shows all classes mixed — no class filter | P1 | **FIXED** — stats-ai.js now accepts `?classId=`; AIReview.tsx has class selector UI |
| 22 | Characters.tsx | "Lịch sử chat HS" tab calls `/api/chat` (student_id filter) — always empty for teachers | P1 | **FIXED** — now uses `/api/teacher/chat-threads` (teacher_id scoped) |
| 23 | submissions.js | Missing `examId`/`classId` query params — Grading couldn't filter | P1 | **FIXED** — added optional `WHERE` clauses |

## Recent Changes

- 2026-04-05 (session 3): Library system full audit + fix: dropped dead `works.status` column (P0 — students permanently locked from characters/chat/multiverse); all AI gates unified to `analysis_status = 'done'`; 5 teacher pages scoped correctly (Grading, ExamBank, AIReview, Characters, TeacherMultiverse); new endpoints `/api/teacher/storylines` + `/api/teacher/chat-threads`; parallel AI analysis via `Promise.allSettled` (7 calls ~105s → ~45s); token tracking added to analyze.js + exam-preview.js + multiverse-preview.js; Library.tsx rewritten: useSWR top-level, localStorage draft auto-save (1s debounce), pulsing dot replaces misleading progress bar; genre normalized to 'van_ban'/'tho' with CHECK constraint; build clean, deployed to Cloudflare Pages.
- 2026-04-04 (session 2): Full system verify + fix: 10 syntax/logic bugs fixed (activity.js: 4 errors, warnings.js: 3 errors, works/[id]/*.js: 2 wrong import paths, exams.js: duplicate validation, admin/logs.js: unused var, chat.js: N+1 already fixed in prior session); CLAUDE.md tech debt updated; deployed to Cloudflare Pages; all endpoints verified (401 auth working, JSON responses correct)
- 2026-04-04 (session 1): Full rebuild — database re-organized into `database/schema/` (30 files: base+extend+indexes+teardown) + `database/seed/` (accounts + rubric only); Remote D1 dropped and re-deployed clean. Registration flow complete: LoginPage has DANG KY tab with name + ma lop, auto-enrolls via invite_code; invite_code auto-generated (8-char uppercase) on class creation; Admin/Teacher pages display invite code + copy + regenerate button; 3 syntax errors fixed (auth.js, _skillAssessments.js, rubric.js); TeacherMultiverse uses shared fetcher; dead formatTime removed from Characters.tsx; Results.tsx formatDate import fixed; App.tsx dead React import removed; route /exam-room -> /student/exam-room fixed; stats-ai.js wrong property name fixed; works.js always-pending status fixed; multiverse.js JSON.parse protected; admin/classes.js cascade delete corrected
- 2026-03-31: Full review — TypeScript strict mode enabled; 60 TS errors fixed; SQL injection P0 patched; alert/confirm replaced with modal dialogs; submissions.js 500 cache fixed; SWR type generics corrected
- 2026-03-30: Full review A→Z — 28 audit findings; ErrorBoundary wired; unused dep removed; .env.example + .gitignore fixed

## Skills Usage

→ `~/.claude/skills/SKILL.md`

### Lenh cho du an nay
- `/full-review` — Chay A→Z: audit → cleanup → module-refactor → setup-db → README
- `/cleanup` — Don rac
- `/audit` — Audit phan se dung den
- `/module-refactor` — Chi khi file > 500d hoac god file can sua
