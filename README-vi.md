# Văn Học AI — Nền tảng Dạy & Học Ngữ Văn

> Nền tảng học Ngữ Văn THCS có trợ giúp AI.

## Công nghệ

| Lớp | Công nghệ |
|-----|-----------|
| Frontend | React 19 + Vite + Tailwind CSS v4 |
| Backend | Cloudflare Pages Functions |
| Database | Cloudflare D1 (SQLite) |
| Auth | JWT (jose) |
| Data Fetching | SWR |
| Testing | Playwright |

## Cấu trúc

```
van-hien-ai-edu/
├── src/
│   ├── pages/
│   │   ├── student/          # Trang học sinh
│   │   └── teacher/          # Trang giáo viên
│   ├── components/
│   │   ├── layout/
│   │   └── ui/
│   ├── constants/              # Dữ liệu dùng chung (storylines, rubric, AI review)
│   │   ├── storylines.ts
│   │   ├── grading.ts
│   │   └── aiReview.ts
│   └── contexts/
│       └── AuthContext.tsx    # Auth JWT + route bảo vệ
├── functions/api/             # Cloudflare Pages Functions
│   ├── _middleware.js         # Xác thực JWT
│   ├── _cache.js             # Tiện ích cache
│   ├── auth.js                # Đăng nhập
│   ├── chat.js                # Chat AI (streaming)
│   ├── works.js               # CRUD tác phẩm
│   ├── exams.js               # CRUD đề thi
│   ├── submissions.js         # Nộp bài + chấm điểm
│   ├── classes.js             # Lấy lớp học
│   ├── storylines.js          # GET/POST đa vũ trụ
│   └── stats.js               # Thống kê dashboard
├── database/
│   ├── schema/               # Migrations D1 (001-014 + 999-indexes)
│   │   ├── 001-users.sql → 014-logs.sql
│   │   └── 999-indexes.sql
│   └── seed/                 # Dữ liệu mẫu (001-005)
├── db.legacy/                 # Legacy flat files (KHÔNG SỬ DỤNG)
│   ├── schema.sql
│   └── seed.sql
└── e2e/                       # Playwright E2E
```

## Tính năng

### Học sinh
- Làm bài thi tự động lưu
- Chat với nhân vật văn học AI (streaming)
- Khám phá đa vũ trụ
- Xem kết quả và nhận xét chấm AI

### Giáo viên
- Quản lý thư viện tác phẩm
- Tạo ngân hàng đề thi
- Chấm bài với rubric
- Quản lý nhân vật AI
- Dashboard thống kê

## Khởi động

```bash
# Cài đặt
npm install

# Chạy local
npm run dev

# Build production
npm run build

# Chạy E2E
npx playwright test
```

### Setup Database (Local)

```bash
# Apply migrations (runs all 001-014 + 999-indexes)
npm run db:schema

# Seed dữ liệu (runs 001-005 in order)
npm run db:seed

# Hoặc dev server với DB local
npm run e2e:server
```

### Deploy

```bash
# Deploy lên Cloudflare Pages
npx wrangler pages deploy dist

# Apply migrations lên production
wrangler d1 migrations apply vanhien-db --remote
```

## Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Giáo viên | `an@vanhocai.edu.vn` | (MVP: chỉ cần email) |
| Học sinh | `mai@vanhocai.edu.vn` | (MVP: chỉ cần email) |

## Tech Debt

| # | Vấn đề | Ưu tiên | Trạng thái |
|---|---------|---------|------------|
| 1 | Grading UI bỏ qua input giáo viên (hardcoded 8.5) | P0 | ✅ Đã fix |
| 2 | Câu trả lời bài thi không lưu vào DB | P0 | ✅ Đã fix |
| 3 | Hardcoded studentId trong ExamDetail | P0 | ✅ Đã fix |
| 4 | E2E test credentials không khớp | P1 | ✅ Đã fix |
| 5 | E2E utils ghi vào production DB | P1 | ✅ Đã fix |

> Xem `.claude/memory/` để biết báo cáo audit đầy đủ.
