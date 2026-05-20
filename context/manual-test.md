# Canvas Manual Test Plan

Run these scenarios against `/editor/[roomId]` with a real signed-in Clerk user and a project you own. Where noted, repeat as a second user invited as a collaborator to verify multi-user behavior. Reset state between unrelated sections by reloading the page.

## 0. Pre-flight

- [ ] `npm run dev` starts without errors.
- [ ] `.env.local` includes `DATABASE_URL`, `LIVEBLOCKS_SECRET_KEY`, and the Clerk publishable + secret keys.
- [ ] Sign in with at least two distinct Clerk users (User A = owner, User B = collaborator) in separate browser profiles or windows.
- [ ] User A creates a project from `/editor` (`New Project` → name → submit). URL navigates to `/editor/<slug>-<suffix>`. Canvas loads, dotted background appears edge-to-edge.

## 1. Workspace shell (specs 02, 04, 08)

- [ ] Navbar shows project name centered, `Share` button right, `Sparkles` AI toggle right, `UserButton` right.
- [ ] Left sidebar toggle opens/closes the project sidebar; the icon state reflects open/closed.
- [ ] Right `Sparkles` button toggles the AI sidebar; the X inside the panel also closes it; the navbar icon shows an active highlight when open.
- [ ] Sidebar `My Projects` tab lists the current project with the slug visible and an `aria-current="page"` highlight on the active project (subtle ring + elevated background).
- [ ] Sidebar `Shared` tab is empty for User A (no shared projects yet).
- [ ] Hovering an owned project in the sidebar reveals rename + delete icon actions; shared projects never show them.

## 2. Access control (spec 08)

- [ ] Visit `/editor/<roomId>` as User B (not yet invited): renders `Access denied` page with `Back to projects` link.
- [ ] Visit `/editor/does-not-exist` as User A: renders `Access denied` page.
- [ ] Visit `/editor/<roomId>` while signed out: redirects to `/sign-in`.

## 3. Share dialog (spec 09)

- [ ] As User A click `Share` in the navbar. Dialog opens with project URL prefilled, `Copy` button, and (because owner) an invite form + collaborator list.
- [ ] Click `Copy` → button text flips to `Copied!` for ~1.5s, then reverts. Clipboard contains `https://<origin>/editor/<roomId>`.
- [ ] Invite User B by email → row appears with avatar (or initials fallback), display name, email, and trash icon.
- [ ] Invite the same email again → inline error appears (409 conflict).
- [ ] Invite `not-an-email` → inline error (400 validation).
- [ ] Click trash on a collaborator row → row removes optimistically. Reload — row stays removed.
- [ ] As User B (after being invited) open `/editor/<roomId>` → canvas loads; the Share dialog shows the project URL + collaborator list but no invite form and no trash icons.
- [ ] As User B the project also appears under `Shared` in the sidebar.

## 4. Liveblocks connection (specs 10, 11)

- [ ] On first load the canvas briefly shows `Connecting to canvas…` then renders. No `Could not connect to the collaboration room` fallback.
- [ ] Open the same room in a second browser as User B. Both clients render the same nodes/edges.
- [ ] In DevTools → Network → WS, the Liveblocks websocket connects and stays open (no 4xx close codes).
- [ ] Disable network briefly. The error boundary or Liveblocks lost-connection indicator surfaces; reconnect restores live updates without a full page reload.

## 5. Shape panel + drag-drop (specs 12, 13)

- [ ] Bottom-center pill shows six shapes in this order: Rectangle, Diamond, Circle, Pill, Cylinder, Hexagon. Hover swaps icon color from muted to primary.
- [ ] Drag each shape onto the canvas. Drag image is a faint version of the actual shape (correct silhouette, ~70% opacity), centered on the cursor.
- [ ] Drop releases at the cursor: node appears centered on the drop point, sized per `NODE_SHAPE_DEFAULT_SIZES` (rectangle 160×80, diamond 140×140, circle 100×100, pill 160×60, cylinder 120×100, hexagon 120×110).
- [ ] Each shape renders its correct visual (rectangle / pill / circle are CSS, diamond / hexagon / cylinder are SVG with a visible top-ring on the cylinder).
- [ ] Dropped node defaults to the neutral color and an empty label (placeholder `Label` shows faintly).
- [ ] In a second client (User B), the same node appears within a second without reload.

## 6. Node selection, resize, drag (spec 14)

- [ ] Click a node → it becomes selected (visible border thickens / SVG stroke brightens), `NodeResizer` 8×8 corner handles appear, color toolbar appears above the node.
- [ ] Click empty canvas → node deselects, handles and toolbar disappear.
- [ ] Drag a node by its body → it moves; the move is mirrored live in the second client.
- [ ] Drag a corner handle → node resizes; min 60×40 (cannot shrink past).
- [ ] Resize is mirrored live in the second client.
- [ ] Reload — both position and resized dimensions persist (Liveblocks Storage).

## 7. Node label editing (spec 14)

- [ ] Double-click a node → textarea opens, focused, with any existing label selected.
- [ ] Type text → label updates live on the current client and on the second client per keystroke.
- [ ] Press `Backspace` and `Delete` inside the textarea — characters are removed, the node is NOT deleted.
- [ ] Press `Enter` — inserts a newline (does not commit).
- [ ] Press `Escape` — exits edit mode; current text is retained.
- [ ] Click outside the node — exits edit mode; current text is retained.
- [ ] Clear all label text → the `Label` placeholder reappears at 50% opacity.
- [ ] Long text wraps within the node and the node does not expand on its own; very long content stays centered.

## 8. Node color toolbar (spec 15)

- [ ] Selecting a node shows the swatch row 12px above the node.
- [ ] All eight swatches render with the matching palette fill; the currently active color has a ring (no border) in the paired text color; inactive swatches have `border-surface-border`.
- [ ] Hovering an inactive swatch shows a tight glow in that swatch's text color.
- [ ] Clicking a swatch updates both the node background and the label text color; the toolbar's active ring moves to the new swatch.
- [ ] Clicking the currently active swatch is a no-op (no flicker, no console errors).
- [ ] Dragging or panning is blocked while interacting with the toolbar (clicking a swatch does not move the node and does not pan the canvas).
- [ ] Color change is mirrored live in the second client and persists across reload.

## 9. Edge creation + visuals (spec 16)

- [ ] Hover a node → four small white circular handles (one per side) fade in within 150ms.
- [ ] Move the cursor away → handles fade back to invisible.
- [ ] Drag from any handle to another node's body, or to one of its handles, to create an edge.
- [ ] Drag from a source handle to a source handle on another node → connection succeeds (`ConnectionMode.Loose`).
- [ ] New edge routes as right-angle smooth-step with rounded corners and an arrow marker at the target.
- [ ] Edge stroke is faint at rest; hovering anywhere along the line (including thin segments) brightens it (the 20px hit area works even though only the thin stroke is visible).
- [ ] Selecting an edge keeps it bright.
- [ ] Create several edges between the same two nodes from different handles — each renders without overlapping or merging.

## 10. Edge label editing (spec 16)

- [ ] Double-click an edge → label input opens centered on the smooth-step `labelX`/`labelY`, focused, sized to text width (min 4 chars).
- [ ] Type text → live updates on both clients per keystroke.
- [ ] Press `Enter` → saves and exits edit mode. Label renders as a rounded pill on the edge.
- [ ] Press `Escape` → exits edit mode (text already written persists via the live channel).
- [ ] Blur (click elsewhere) → exits edit mode.
- [ ] Empty label + edge not hovered/selected → no badge rendered (clean canvas).
- [ ] Empty label + edge hovered or selected → faint `Add label` hint badge appears.
- [ ] Clicking inside the label pill does not start a node drag and does not pan the canvas.
- [ ] Edge label persists across reload.

## 11. Node + edge deletion

- [ ] Select a node and press `Backspace` (with focus on canvas, NOT in a textarea) → node deletes along with any connected edges. Mirrored on second client.
- [ ] Select an edge and press `Backspace` → edge deletes. Connected nodes remain.
- [ ] With a textarea or input focused, pressing `Backspace`/`Delete` only edits text — no node/edge is removed.
- [ ] Multi-select with click+drag selection box, then `Backspace` → all selected elements are removed.

## 12. Canvas controls bar — buttons (spec 17)

- [ ] Bottom-left of the canvas shows a pill toolbar with: ZoomOut, Maximize2 (fit), ZoomIn, divider, Undo2, Redo2.
- [ ] Toolbar visually matches the shape panel's chrome (same rounded-full pill, border, surface color, shadow, blur).
- [ ] Click `Zoom out` → canvas zooms out with a short ~200ms animation.
- [ ] Click `Zoom in` → canvas zooms in with the same animation.
- [ ] Click `Fit view` → canvas eases to fit all nodes/edges; with no content it eases to the default origin.
- [ ] At app load on an empty room, Undo and Redo are dimmed (~40% opacity) and ignore clicks.
- [ ] Add a node → Undo becomes active; Redo stays dimmed.
- [ ] Click Undo → the added node disappears, Redo activates.
- [ ] Click Redo → the node reappears.
- [ ] Undo a delete → the deleted node returns with its prior position, size, color, label.
- [ ] Undo of a node move returns it to its prior position; redo restores the move.
- [ ] Hovering a disabled button does NOT swap colors (cursor shows `not-allowed`).
- [ ] Toolbar overlays the canvas but does not block panning when the cursor is over canvas space outside the pill.

## 13. Canvas controls bar — keyboard shortcuts (spec 17)

Focus the canvas (click empty space) before each shortcut. Do not have a textarea/input focused unless the test says so.

- [ ] `+` (Shift+`=` on US keyboards) → zooms in with animation.
- [ ] `=` → zooms in (same as `+`).
- [ ] `-` → zooms out.
- [ ] `Cmd/Ctrl + Z` → undoes the last canvas action.
- [ ] `Cmd/Ctrl + Shift + Z` → redoes.
- [ ] `Cmd/Ctrl + Y` → redoes (Windows-style alt).
- [ ] `Cmd + +` (Mac) / `Ctrl + +` (Win) → browser page zooms (NOT canvas zoom). Canvas zoom level does not change.
- [ ] Open a node label textarea and press `Cmd/Ctrl + Z` → undoes text in the textarea; canvas history does NOT pop.
- [ ] Inside the same textarea press `+` and `-` → those characters are typed (not zoom).
- [ ] Inside an edge label input, the same rules apply (no canvas zoom; text undo works).
- [ ] Inside the Share dialog email input, the same rules apply.
- [ ] Type in any `contentEditable` element if present → shortcuts are ignored there too.

## 14. Multi-user real-time (specs 10, 16, etc.)

Two browser sessions on the same room (User A + User B).

- [ ] Add a node in client 1 → appears in client 2 within a second.
- [ ] Resize / move / recolor / relabel in client 1 → all changes mirror live in client 2.
- [ ] Add an edge in client 1 → appears with the same routing in client 2.
- [ ] Edit an edge label in client 1 → text streams in per-keystroke in client 2.
- [ ] Delete a node in client 1 → it disappears in client 2; connected edges also go.
- [ ] Undo in client 1 only affects client 1's view of history but the canvas state is shared, so the undone change reverses for both clients.

## 15. MiniMap

- [ ] MiniMap renders bottom-right with all nodes plotted.
- [ ] MiniMap is pannable (drag inside it pans the main viewport) and zoomable (scroll inside it zooms).
- [ ] MiniMap updates live as nodes move/add/remove.

## 16. Project sidebar actions (spec 04 + 07)

- [ ] Click `New Project` in the sidebar → create dialog opens with live slug preview.
- [ ] Submit → navigates to the new room with a fresh empty canvas.
- [ ] Hover an owned project → rename + delete icons appear.
- [ ] Rename → input prefilled with current name, autofocused, Enter submits → name updates everywhere.
- [ ] Delete the currently active project → redirects to `/editor`.
- [ ] Delete a non-active project → stays on the current route; sidebar refreshes without the deleted item.
- [ ] Switch between projects via sidebar → URL updates and the canvas reloads with the new room's content.

## 17. Theme / token regression

- [ ] No light-mode flashes on initial load; the page renders dark immediately.
- [ ] No raw Tailwind color classes (`zinc-*`, `slate-*`, hex values) leak in — spot-check via DevTools that text/border colors resolve to the documented `--text-*` / `--border-*` / `--bg-*` variables.
- [ ] Border-radius scale: small icon buttons use `rounded-xl`/`rounded-full`, panels and cards use `rounded-2xl`, dialogs use `rounded-3xl`.
- [ ] All icons are Lucide stroke-based; no filled glyphs introduced.

## 18. Build + lint sanity

- [ ] `npm run build` succeeds.
- [ ] `npm run lint` reports no errors.
- [ ] Browser console is clean during a normal session (no React key warnings, no Liveblocks 4xxx codes, no unhandled promise rejections).

## Known scope limits (not yet implemented — do not test as bugs)

- Live cursors / presence avatars on the canvas (planned).
- Canvas snapshot persistence to Vercel Blob (planned — current persistence is Liveblocks Storage only).
- AI panel interactions (panel shell only; no prompt input / actions yet).
