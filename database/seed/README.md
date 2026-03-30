# Seed Data

Run after schema migrations in order:

| # | File | Contents |
|---|------|----------|
| 001 | users.sql | Demo teacher + 2 students |
| 002 | classes.sql | Classes + class-student assignments |
| 003 | works.sql | Literary works |
| 004 | exams.sql | Exams |
| 005 | submissions.sql | Submissions + storylines |

Run all:
```bash
wrangler d1 execute vanhien-db --local --file=./database/seed/001-users.sql
wrangler d1 execute vanhien-db --local --file=./database/seed/002-classes.sql
# ... etc
```
