# Văn Học AI — Vietnamese Literature Learning Platform

> AI-powered platform where students learn Vietnamese literature through interactive character chats, branching storylines, and rubric-based AI grading.

[![Build](https://img.shields.io/badge/Build-PASSING-green?style=flat-square)](#)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](#)

### Tech Stack

| Layer | Stack |
|-------|-------|
| **Frontend** | ![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white) |
| **Backend** | ![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white) ![D1](https://img.shields.io/badge/D1-SQLite-336791?style=flat-square&logo=cloudflare) |
| **AI** | ![Gemma](https://img.shields.io/badge/Gemma%203-8E75B2?style=flat-square&logo=googlegemini&logoColor=white) ![Workers AI](https://img.shields.io/badge/Workers_AI-Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white) |
| **Auth** | ![JWT](https://img.shields.io/badge/JWT-jose-000000?style=flat-square) |
| **Data Fetching** | ![SWR](https://img.shields.io/badge/SWR-000000?style=flat-square&logo=swr) |

### Why This Platform?

Vietnamese literature education relies heavily on passive reading and rote memorization. Students rarely engage with characters emotionally, and teachers lack scalable tools for personalized feedback. This platform bridges that gap — letting students step inside classic works through AI-powered character conversations and choose-your-own-adventure storylines, while giving teachers AI-assisted grading that scores against structured rubrics consistently.

### Highlights

- **Character Chat** — Students converse in real-time with AI-powered literary characters (streaming responses, conversation history)
- **Multiverse Storylines** — Branching narrative paths let students explore "what if" scenarios and see consequences
- **AI Rubric Grading** — Every submission is scored against a configurable rubric; AI provides per-criterion feedback with scores
- **Cloudflare Edge** — All inference runs at the edge via Workers AI; sub-100ms cold start, global deployment from day one

### Quick Start

```bash
npm install && npm run dev
```

### Documentation

| Document | Description |
|---------|-------------|
| [Technical Spec](docs/technical-spec.md) | Architecture, hard problems solved, optimizations, competitive advantages |
| [Hướng dẫn sử dụng](docs/vi-user-guide.md) | Cách dùng hệ thống — tiếng Việt |
| [User Guide](docs/user-guide.md) | How to use the platform — English |
| [Tài liệu kỹ thuật](docs/vi-technical-spec.md) | Kiến trúc, bài toán khó, tối ưu — tiếng Việt |
