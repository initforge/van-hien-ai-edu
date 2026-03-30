# Văn Học AI — Vietnamese Literature Learning Platform

> AI-powered Ngữ Văn THCS teaching and learning platform.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite + Tailwind CSS v4 |
| Backend | Cloudflare Pages Functions |
| Database | Cloudflare D1 (SQLite) |
| Auth | JWT (jose) |
| Data Fetching | SWR |
| Testing | Playwright |

## Structure

```
van-hien-ai-edu/
├── src/
│   ├── pages/
│   │   ├── Homepage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── ExamRoomPage.tsx
│   │   ├── student/          # Student pages
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── StudentExamRoom.tsx
│   │   │   ├── ExamDetail.tsx
│   │   │   ├── CharacterChat.tsx
│   │   │   ├── Multiverse.tsx
│   │   │   ├── Results.tsx
│   │   │   └── Profile.tsx
│   │   └── teacher/          # Teacher pages
│   │       ├── TeacherDashboard.tsx
│   │       ├── Library.tsx
│   │       ├── ExamBank.tsx
│   │       ├── Grading.tsx
│   │       ├── Characters.tsx
│   │       ├── AIReview.tsx
│   │       └── TeacherMultiverse.tsx
│   ├── components/
│   │   ├── layout/
│   │   └── ui/
│   ├── constants/              # Shared data (storylines, grading rubric, AI review)
│   │   ├── storylines.ts
│   │   ├── grading.ts
│   │   └── aiReview.ts
│   └── contexts/
│       └── AuthContext.tsx    # JWT auth + protected routes
├── functions/api/             # Cloudflare Pages Functions
│   ├── _middleware.js         # JWT verification
│   ├── _cache.js              # Cache utilities
│   ├── auth.js                # POST /api/auth
│   ├── me.js                  # GET /api/me
│   ├── chat.js                # POST /api/chat (AI streaming)
│   ├── works.js               # CRUD literary works
│   ├── exams.js               # CRUD exams
│   ├── submissions.js         # Student submissions + grading
│   ├── classes.js            # GET classes
│   ├── storylines.js          # GET/POST multiverse storylines
│   └── stats.js               # Dashboard stats
├── database/
│   ├── schema/               # D1 migrations (001-014 + 999-indexes)
│   │   ├── 001-users.sql → 014-logs.sql
│   │   └── 999-indexes.sql
│   └── seed/                 # Seed data (001-005)
├── db.legacy/                 # Legacy flat files (DO NOT USE)
│   ├── schema.sql            # Original, preserved as-is
│   └── seed.sql
└── e2e/                       # Playwright E2E tests
    ├── auth.setup.ts
    ├── integration-lifecycle.spec.ts
    ├── student/
    └── teacher/
```

## Features

### Student
- Take exams with auto-save
- Chat with AI literary characters (streaming)
- Multiverse storyline exploration
- View results and AI grading feedback

### Teacher
- Manage literary works library
- Create exam banks
- Grade submissions with rubric editor
- Manage AI character personas
- Dashboard analytics

## Getting Started

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build for production
npm run build

# Run E2E tests
npx playwright test
```

### Setup Database (Local)

```bash
# Apply migrations (runs all 001-014 + 999-indexes)
npm run db:schema

# Seed data (runs 001-005 in order)
npm run db:seed

# Or run dev server with local DB
npm run e2e:server
```

### Deploy

```bash
# Deploy to Cloudflare Pages
npx wrangler pages deploy dist

# Apply production migrations
wrangler d1 migrations apply vanhien-db --remote
```

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Teacher | `an@vanhocai.edu.vn` | (MVP: email only) |
| Student | `mai@vanhocai.edu.vn` | (MVP: email only) |

## Tech Debt

| # | Issue | Priority | Status |
|---|-------|----------|--------|
| 1 | Grading UI ignores teacher input (hardcoded 8.5) | P0 | ✅ Fixed |
| 2 | Exam answers not persisted to DB | P0 | ✅ Fixed |
| 3 | Hardcoded studentId in ExamDetail | P0 | ✅ Fixed |
| 4 | E2E test credentials mismatch | P1 | ✅ Fixed |
| 5 | E2E utils write to production DB | P1 | ✅ Fixed |

> See `.claude/memory/` for full audit reports.
