# Database Migrations

Run in order: `001` → `002` → ... → `999-indexes`

| # | File | Contents |
|---|------|----------|
| 001 | users.sql | Users table |
| 002 | classes.sql | Classes table |
| 003 | class_students.sql | Class-Student N:N join |
| 004 | works.sql | Literary works |
| 005 | exams.sql | Exams |
| 006 | questions.sql | Questions |
| 007 | submissions.sql | Student submissions |
| 008 | submission_answers.sql | Per-question answers |
| 009 | storylines.sql | Multiverse storylines |
| 010 | storyline_nodes.sql | Storyline nodes |
| 011 | chat_threads.sql | Chat threads |
| 012 | chat_messages.sql | Chat messages |
| 013 | token_logs.sql | AI token audit |
| 014 | logs.sql | Auth logs |
| 999 | indexes.sql | All FK indexes |

Run all:
```bash
wrangler d1 migrations apply vanhien-db --local
```
