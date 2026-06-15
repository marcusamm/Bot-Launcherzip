# Objective First — GFN Bot Seeder

A tactical control panel for managing NVIDIA GeForce Now browser bots that seed a Hell Let Loose server. Matches the dark military aesthetic of the existing C# Objective First Control Panel.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/gfn-bots run dev` — run the frontend (port auto-assigned)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Tailwind CSS + shadcn/ui

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod schemas (used by server)
- `lib/db/src/schema/bots.ts` — Drizzle schema for bots table
- `artifacts/api-server/src/routes/bots.ts` — bot CRUD + launch/stop routes
- `artifacts/gfn-bots/src/` — React frontend (dark tactical theme)

## Architecture decisions

- All API contracts defined in OpenAPI first, then generated via Orval.
- Bot status tracking is persisted in PostgreSQL — statuses survive server restarts.
- `launch` and `stop` endpoints update the DB status immediately; actual GFN browser automation must be wired externally on the user's machine.
- Frontend polls bot list every 5 seconds via `useListBots({ query: { refetchInterval: 5000 } })`.
- Bulk actions (launch-all, stop-all) use dedicated `/bots/launch-all` and `/bots/stop-all` endpoints ordered before `/bots/:id` in Express to avoid param capture.

## Product

- Dashboard showing all 17 GeForce Now bots with live status (RUNNING / LAUNCHING / STOPPED / ERROR)
- LAUNCH ALL / STOP ALL master controls at the top
- Per-bot launch and stop buttons with loading states
- Auto-refresh every 5 seconds — no manual refresh needed
- Dark military tactical theme matching the existing Objective First C# app
- Sidebar nav mirroring the C# app: Dashboard, Bots, Seeding, Live Map, Ban Manager, Audit, GFN Seeder
- Connection panel at the bottom showing 127.0.0.1:8787

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Express 5: static paths `/bots/launch-all` and `/bots/stop-all` MUST be registered before `/bots/:id` in the router, otherwise Express captures "launch-all" as a param.
- After any OpenAPI spec change: run `pnpm --filter @workspace/api-spec run codegen` before touching route or frontend code.
- Generated files in `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/` — do not hand-edit.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
