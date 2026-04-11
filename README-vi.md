# Văn Học AI — Nền tảng Dạy & Học Ngữ Văn

> Nền tảng học Ngữ Văn THCS có trợ giúp AI — học sinh trò chuyện với nhân vật văn học, khám phá đa vũ trụ, nhận phản hồi chấm điểm tự động.

[![Build](https://img.shields.io/badge/Build-PASSING-green?style=flat-square)](#)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](#)

### Công nghệ sử dụng

| Lớp | Stack |
|-----|-------|
| **Frontend** | ![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white) |
| **Backend** | ![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white) ![D1](https://img.shields.io/badge/D1-SQLite-336791?style=flat-square&logo=cloudflare) |
| **AI** | ![Gemma](https://img.shields.io/badge/Gemma%203-8E75B2?style=flat-square&logo=googlegemini&logoColor=white) ![Workers AI](https://img.shields.io/badge/Workers_AI-Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white) |
| **Auth** | ![JWT](https://img.shields.io/badge/JWT-jose-000000?style=flat-square) |
| **Data Fetching** | ![SWR](https://img.shields.io/badge/SWR-000000?style=flat-square&logo=swr) |

### Tại sao có hệ thống này?

Việc dạy và học Ngữ Văn hiện nay chủ yếu dựa vào đọc thụ động và học thuộc lòng. Học sinh hiếm khi đồng cảm với nhân vật, giáo viên thiếu công cụ để phản hồi cá nhân hóa ở quy mô lớp. Hệ thống này thu hẹp khoảng cách đó — học sinh bước vào tác phẩm qua chat nhân vật AI và câu chuyện nhiều nhánh, giáo viên nhận hỗ trợ chấm bài theo rubric với phản hồi chi tiết từng tiêu chí.

### Điểm nổi bật

- **Chat nhân vật** — Học sinh trò chuyện real-time với nhân vật văn học AI (phản hồi streaming, lịch sử hội thoại)
- **Đa vũ trụ** — Câu chuyện nhiều nhánh cho phép khám phá kịch bản "điều gì sẽ xảy ra nếu" và xem hậu quả
- **Chấm điểm AI theo rubric** — Mỗi bài nộp được chấm theo rubric có cấu hình; AI phản hồi chi tiết từng tiêu chí với điểm số
- **Chạy tại Edge** — Mọi suy luận AI chạy ở edge qua Workers AI; cold start dưới 100ms, deploy toàn cầu từ đầu

### Bắt đầu nhanh

```bash
npm install && npm run dev
```

### Tài liệu

| Tài liệu | Mô tả |
|---------|-------|
| [Technical Spec](docs/technical-spec.md) | Kiến trúc, bài toán khó, tối ưu — tiếng Anh |
| [Tài liệu kỹ thuật](docs/vi-technical-spec.md) | Kiến trúc, bài toán khó, tối ưu — tiếng Việt |
| [User Guide](docs/user-guide.md) | Cách dùng hệ thống — tiếng Anh |
| [Hướng dẫn sử dụng](docs/vi-user-guide.md) | Cách dùng hệ thống — tiếng Việt |
