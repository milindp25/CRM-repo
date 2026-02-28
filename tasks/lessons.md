# Lessons Learned

> Patterns and mistakes to avoid. Updated after every correction from the user.

## Database & Prisma
- **Aiven Query Editor is read-only** — cannot run UPDATE/INSERT. Use PrismaClient scripts or PG Studio instead.
- **`prisma.user.update` requires unique field** — `email` is not unique by itself (compound key `companyId_email`). Use `findFirst` then `update` by `id`.
- **Prisma `@@map` matters** — model `User` maps to table `users`. Raw SQL must use the table name, not the model name.

## Environment & Paths
- **Git Bash on Windows** — use forward slashes (`/d/Practice/...`), not backslashes (`D:\Practice\...`).
- **Worktree path != main repo path** — scripts created in worktree are at `.claude/worktrees/<name>/`, not the user's main repo root.
- **Don't run scripts against local DB when user wants production** — always confirm which DATABASE_URL is being used.

## Deployment
- **Vercel deploys from `main` branch** — branch changes aren't live until merged. Don't test deployed URLs expecting branch code.
- **Render free tier cold starts** — first request takes 30-60s. Wait before assuming API is down.

## Auth
- **JWT config key** — admin-api uses `JWT_EXPIRES_IN` (not `JWT_EXPIRATION`). Check `.env` key names match code.
- **bcrypt hashes contain `$`** — cannot be used in bash inline commands. Write to a `.ts` file and run via `npx tsx`.
