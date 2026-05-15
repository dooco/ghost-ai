# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- In progress

## Current Goal

- Define and implement AI panel interactions (prompt input, action controls, and open/close behavior) in a dedicated feature spec.

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

## In Progress

- None currently.

## Next Up

- Define and implement AI panel interactions (prompt input, action controls, and open/close behavior) in a dedicated feature spec.

## Open Questions

- No dedicated feature-spec file currently defines AI panel interaction requirements (input behavior, actions, and visibility controls). Should this be added as `context/feature-specs/05-editor-surface.md` before functional implementation?

## Architecture Decisions

- Add decisions that affect the system design or data model.

## Session Notes

- Editor page now includes full base workspace frame: left floating project sidebar, center canvas scaffold, and right slide-over AI panel shell.
- Auth wired: Clerk dark theme from `@clerk/ui/themes`, CSS variable overrides, `proxy.ts` route guard, `/sign-in` and `/sign-up` two-panel pages, `/` redirect logic, `UserButton` in navbar.
- Editor home is now the center content of `/editor`; the previous `CanvasSurface` scaffold remains in the codebase for later use once a project-open state exists. Project sidebar consumes mock data from `lib/mock-projects.ts`; owned vs shared is the sole gating signal for showing rename/delete actions. Dialog state is centralized in `useProjectDialogs` and lives at `EditorWorkspaceShell`.
