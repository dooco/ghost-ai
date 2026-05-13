# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Development Commands

```bash
npm run dev      # Start Next.js dev server
npm run build    # Production build
npm run lint     # ESLint
npm start        # Start production server
```

There are no tests configured yet.

Add shadcn components via CLI — do not write them manually:

```bash
npx shadcn@latest add <component>
```

## Stack

| Layer            | Technology              |
| ---------------- | ----------------------- |
| Framework        | Next.js 16 + TypeScript |
| UI               | Tailwind v4 + shadcn/ui |
| Auth             | Clerk                   |
| Database         | Prisma + PostgreSQL     |
| Canvas           | Liveblocks + React Flow |
| Background tasks | Trigger.dev             |
| Artifact storage | Vercel Blob             |

## Architecture Overview

- `app/` — Next.js App Router pages and API routes. Default to Server Components; add `"use client"` only when interactivity or real-time state requires it.
- `app/api/` — Thin route handlers: validate input, check auth/ownership, trigger background tasks, persist metadata. No long-lived AI work here.
- `trigger/` — All durable background jobs (AI design generation, spec generation). Long-running AI work belongs here, not in request handlers.
- `lib/` — Shared infrastructure: Prisma client, auth helpers, `cn()` utility.
- `components/editor/` — App-level editor surface components (navbar, sidebars, canvas scaffold, AI panel). These are project-specific — do not confuse with `components/ui/`.
- `components/ui/` — shadcn/ui generated primitives. Do not modify these files.
- `prisma/` — Schema and generated client.
- `types/canvas.ts` — Canvas node/edge types, `NODE_COLORS`, and `NODE_SHAPES`.

## Storage Split

- **PostgreSQL (Prisma)**: project metadata, ownership, collaborators, spec records, task run records.
- **Vercel Blob**: canvas snapshots (`canvas/{projectId}.json`) and generated Markdown specs (`specs/{projectId}/{specId}.md`). Prisma stores only the blob URL reference.

## Styling Rules

- Dark only — no light mode.
- All colors come from CSS custom properties in `globals.css`, mapped to Tailwind tokens via `@theme inline`. Never use raw Tailwind color classes like `zinc-*` or hardcoded hex values.
- Key tokens: `bg-base`, `bg-surface`, `bg-elevated`, `text-copy-primary`, `text-copy-muted`, `border-surface-border`, `text-brand`, `bg-accent-dim`.
- Border radius scale: `rounded-xl` (small elements) → `rounded-2xl` (cards/panels) → `rounded-3xl` (modals).
- Icons: Lucide React, stroke-based only.

## Current Implementation State

See `context/progress-tracker.md` for the current phase, completed work, and next steps. Update it after each meaningful change.
