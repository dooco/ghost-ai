# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- In progress

## Current Goal

- Wire the editor home sidebar and dialogs to the real project API (feature spec 07).

## Completed

- Installed and configured shadcn/ui.
- Added generated UI primitives: Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea.
- Installed Lucide React for icon usage.
- Added shared class merge utility `cn()` in `lib/utils.ts`.
- Configured dark-theme token mappings in globals CSS so shadcn utilities resolve without light defaults.
- Added `EditorNavbar` app-level chrome component with fixed height, left/center/right sections, and sidebar toggle icon states.
- Added `ProjectSidebar` floating slide-in shell with header, close action, tabs (`My Projects`, `Shared`), empty placeholders, and bottom `New Project` CTA.
- Added `EditorDialogShell` reusable dialog styling pattern using existing tokenized colors with support for title, description, and footer actions.
- Added `EditorWorkspaceShell` app-level composition component that renders navbar + floating sidebar and manages sidebar open/close state.
- Added `CanvasSurface` center scaffold component for the editor workspace.
- Added `AiSidebarShell` right-side slide-over shell component for the editor layout.
- Updated `EditorWorkspaceShell` composition to render the left project sidebar, center canvas scaffold, and right AI panel shell.
- Implemented auth (feature-spec 03-auth): `ClerkProvider` wraps root layout with `@clerk/ui` dark theme and CSS variable overrides; `proxy.ts` protects all routes except `/sign-in` and `/sign-up`; two-panel sign-in and sign-up pages created; `app/page.tsx` redirects authenticated users to `/editor` and unauthenticated users to `/sign-in`; editor workspace shell moved to `app/editor/page.tsx`; `UserButton` added to editor navbar right section.
- Implemented feature-spec 04-project-dialogs: added `EditorHome` center content (heading, description, `New Project` button with `Plus` icon) replacing the canvas scaffold in the workspace shell; added `CreateProjectDialog` with live slug preview driven by `lib/slug.ts`; added `RenameProjectDialog` with prefilled autofocused input, current name in description, and Enter-to-submit; added `DeleteProjectDialog` as confirmation-only with destructive button; added `useProjectDialogs` hook (`hooks/use-project-dialogs.ts`) managing dialog mode, target, form name, and submitting state; updated `ProjectSidebar` to render owned/shared mock projects (`lib/mock-projects.ts`, `types/project.ts`), reveal rename/delete icon actions on hover for owned items only, and add a mobile-only backdrop scrim that closes the sidebar on tap; wired editor home and sidebar create/rename/delete entry points through the hook in `EditorWorkspaceShell`. Mock data only — no API or persistence.
- Implemented feature-spec 05-prisma: created root Prisma config and schema structure (`prisma.config.ts`, `prisma/schema.prisma`, `prisma/models/project.prisma`) with `ProjectStatus` enum, `Project` model, `ProjectCollaborator` model, relation cascade delete, and required indexes; added cached Prisma singleton at `lib/prisma.ts` that branches on `DATABASE_URL` (`prisma+postgres://` uses Accelerate, otherwise `@prisma/adapter-pg`); installed Prisma runtime dependencies (`@prisma/client`, `@prisma/adapter-pg`, `pg`, `@prisma/extension-accelerate`, `dotenv`); ran migration `init_project_data_layer`, generated client, and verified `npm run build` passes.
- Implemented feature-spec 06-project-apis: added `app/api/projects/route.ts` (`GET` lists current user's projects by `ownerId` ordered by `createdAt` desc; `POST` creates a project with Clerk `userId` as `ownerId`, defaults missing/blank name to `Untitled Project`, leaves IDs to the schema's `cuid()`); added `app/api/projects/[projectId]/route.ts` (`PATCH` validates required `name`, enforces owner-only mutation, otherwise returns `403`; `DELETE` enforces owner-only and returns `204` on success); both return `401` for unauthenticated requests and `404` when the project does not exist; updated `proxy.ts` to short-circuit middleware for `/api/*` paths so route handlers can emit explicit `401`/`403`/`404` codes rather than the Clerk sign-in redirect. Backend only; UI is not wired.
- Implemented feature-spec 07-wire-editor-home: added `lib/projects.ts` server helper (`getProjectsForCurrentUser` queries Prisma for owned projects by Clerk `userId` and shared projects via `ProjectCollaborator.email` matched against the current user's primary email, returning each with an `"owned" | "shared"` flag); converted `app/editor/page.tsx` to an async server component that fetches both lists and passes them to `EditorWorkspaceShell`; added `app/editor/[projectId]/page.tsx` workspace route that loads the project, enforces owner-only access via `notFound()`, fetches the sidebar lists, and passes `activeProjectId` to the shell; extended `POST /api/projects` to accept an optional `id` so the client-generated room ID becomes the project ID (room ID = `${slug}-${6-char base36 suffix}`); replaced `MockProject` with `ProjectSummary` (`{ id, name, ownership }`) in `types/project.ts`; deleted `lib/mock-projects.ts` and `hooks/use-project-dialogs.ts`; added `hooks/use-project-actions.ts` (`useProjectActions`) which owns dialog mode/target/name/isSubmitting state, generates the room ID, and calls `POST /api/projects`, `PATCH /api/projects/[id]`, and `DELETE /api/projects/[id]` — create navigates with `router.push` to `/editor/${project.id}`, rename `router.refresh()`s, delete redirects to `/editor` if the deleted project matches `activeProjectId`, otherwise `router.refresh()`s; updated `ProjectSidebar` to consume `ownedProjects` / `sharedProjects` props of `ProjectSummary[]`, displaying the project ID in the slug slot; rewired `EditorWorkspaceShell` to accept server-fetched lists plus `activeProjectId` and pipe the hook through the existing create/rename/delete dialogs.

## In Progress

- None currently.

## Next Up

- Define and implement AI panel interactions (prompt input, action controls, and open/close behavior) in a dedicated feature spec.

## Open Questions

- No dedicated feature-spec file currently defines AI panel interaction requirements (input behavior, actions, and visibility controls). Should this be added as `context/feature-specs/06-editor-surface.md` before functional implementation?

## Architecture Decisions

- Add decisions that affect the system design or data model.

## Session Notes

- Editor page now includes full base workspace frame: left floating project sidebar, center canvas scaffold, and right slide-over AI panel shell.
- Auth wired: Clerk dark theme from `@clerk/ui/themes`, CSS variable overrides, `proxy.ts` route guard, `/sign-in` and `/sign-up` two-panel pages, `/` redirect logic, `UserButton` in navbar.
- Editor home is now the center content of `/editor`; the previous `CanvasSurface` scaffold remains in the codebase for later use once a project-open state exists. Project sidebar consumes mock data from `lib/mock-projects.ts`; owned vs shared is the sole gating signal for showing rename/delete actions. Dialog state is centralized in `useProjectDialogs` and lives at `EditorWorkspaceShell`.
- Prisma data layer baseline is now in root runtime paths, not context-only paths: schema/model files are under `prisma/`, client singleton is in `lib/prisma.ts`, and the initial migration has been applied with generated client output in `generated/prisma`.
- Project API routes are backend-only and not wired into the editor UI — the sidebar still consumes mock data from `lib/mock-projects.ts`. Middleware (`proxy.ts`) now skips `auth.protect()` for `/api/*` so route handlers control the response code for unauthenticated/forbidden cases; Clerk continues to protect every non-API route except sign-in/sign-up.
- Editor home (`/editor`) and per-project workspace (`/editor/[projectId]`) are server components that fetch through `lib/projects.ts`; mock data has been removed. Project ID is now intentionally the Liveblocks room ID (`${slug}-${suffix}`), generated client-side in `useProjectActions` and persisted via the optional `id` field on `POST /api/projects`. `Project` schema is unchanged — the slug/room ID lives inside the existing `id` column rather than a separate field. `useProjectActions` is the only dialog hook; create routes the user to `/editor/${projectId}`, rename refreshes, and delete redirects to `/editor` only when the deleted project equals `activeProjectId` (otherwise refreshes). The `[projectId]` workspace page currently checks ownership only and renders the same shell as the home — a real workspace surface (canvas load, collaborator access) is still to come.
