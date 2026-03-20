# Theater Times — Build Plan

Each phase is a vertical slice: do it, verify it works, then move on.
**You (manual)** = steps done in Supabase dashboard, terminal, or browser.
**Claude** = code Claude writes.

---

## Phase 1 — Environment + Skeleton

### You (manual)

1. In Supabase dashboard → **Project Settings → API**: copy `Project URL` and `anon public` key.
2. Create `.env.local` in the project root:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<your project url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon key>
   ```
3. In Supabase → **Authentication → Providers**: confirm Email is enabled.
4. In Supabase → **Authentication → Settings**: disable "Confirm email" for now (easier local dev).
5. Create one admin user: **Authentication → Users → Add user** (email + password).

### Claude

- `app/lib/supabase/client.ts` — `createBrowserClient<Database>`
- `app/lib/supabase/server.ts` — async `createClient()` using `createServerClient<Database>` with cookie store
- `middleware.ts` — session refresh on every request; redirect unauthenticated users away from `/` to `/login`
- `app/login/page.tsx` — minimal form: email + password fields, submit button
- `app/login/actions.ts` — one server action: `signIn(formData)` → `signInWithPassword` → `redirect('/')`
- `app/actions/auth.ts` — `signOut()` server action → `supabase.auth.signOut()` → `redirect('/login')`

### Checkpoint

`npm run dev` → `/login` loads → sign in → lands on `/` (blank page is fine) → sign out works.

---

## Phase 2 — Read Path (Home Screen)

### Claude

- `app/page.tsx` — async server component
  - calls `createClient()` (server), gets `user` via `getUser()`
  - fetches the seeded theater: `supabase.from('theaters').select().single()`
  - calls `supabase.rpc('get_active_showtimes', { p_theater_id })` for the schedule
  - renders a plain `<table>` with columns: movie, auditorium, start, end, format, rating, last updated
  - sign-out button (client component wrapping the server action)
- Sortable columns and a simple text filter can be client-side state on a `<ShowtimesTable>` client component (receives `showtimes` as a prop, sorts/filters in memory — no extra fetch needed).

### Checkpoint

Sign in → home screen shows 6 active showtimes from seed data → sort by start time works → filter by movie title works.

---

## Phase 3 — Write Path (CSV Import, Core Mutations)

This is the main thing the app does. Three server actions and one RPC call.

### Claude

**Upload + normalize** (`app/actions/import.ts`):

- `createImport(formData: FormData)`:
  1. Parse the uploaded CSV file into rows (built-in `text.split('\n')` — no library needed for this schema).
  2. Normalize each row: trim whitespace, collapse spaces via the DB `normalize_title` RPC, deduplicate rows with identical `(movie_title, start_time)`.
  3. Fetch current active showtimes for the theater.
  4. Reconcile: for each normalized row, match against existing showtimes by `start_time`. Use `title_similarity` RPC to decide add vs update. Any existing showtime not matched gets action `archive`.
  5. Insert one `imports` row (`status: 'pending'`).
  6. Bulk-insert all `import_rows` with `action`, `raw_values`, `normalized`, `field_diffs`, `showtime_id`.
  7. Update import to `status: 'previewing'`.
  8. `redirect('/imports/[id]/preview')`.

**Apply** (`app/actions/import.ts`):

- `applyImport(importId: string)`:
  1. `supabase.rpc('apply_import', { p_import_id: importId, p_user_id: user.id })`
  2. `revalidatePath('/')`
  3. `redirect('/')`

**Clear schedule** (`app/actions/schedule.ts`):

- `clearSchedule(theaterId: string)`:
  1. `supabase.rpc('clear_schedule', { p_theater_id: theaterId, p_user_id: user.id })`
  2. `revalidatePath('/')`

**Pages**:

- `app/upload/page.tsx` — drag-and-drop or `<input type="file" accept=".csv">`, submits to `createImport`. Simple server component form.
- Home screen — add "Upload new drop" link → `/upload`, and "Clear schedule" button (calls `clearSchedule`).

### Checkpoint

- Upload the sample "New Partner Drop" CSV from the spec.
- Open Supabase table editor: `imports` has one row (`applied`), `import_rows` has 11 rows with correct actions.
- `showtimes` table: Wonka + Oppenheimer are `archived`, Kung Fu Panda 4 is `active`, Spider-Man/Inside Out/Dune rows are updated.
- Back in browser: home screen reflects the new schedule.

---

## Phase 4 — Normalization Preview Screen

The "preview changes" screen before an admin commits the import.

### Claude

- `app/imports/[id]/preview/page.tsx` — server component
  - Fetches the import + all its `import_rows` grouped by action: `adds`, `updates`, `archives`.
  - Passes data to a `<PreviewClient>` client component.

- `app/imports/[id]/preview/PreviewClient.tsx` — client component
  - Holds editable state: `useState<ImportRow[]>` initialized from server props.
  - Renders three sections:
    - **Add** (n) — table of new showtimes, each field editable inline (`<input>` on click).
    - **Update** (n) — table showing old → new for each changed field, new values editable.
    - **Archive** (n) — read-only list of showtimes being dropped.
  - "Approve" button: collects edited rows, calls a server action.
  - "Cancel" button: calls `cancelImport` server action → sets import to `cancelled` → `redirect('/')`.

- `app/actions/import.ts`:
  - `saveAndApply(importId, editedRows)`:
    1. Update any edited `import_rows` in DB (upsert `normalized` + `field_diffs`).
    2. Call `apply_import` RPC.
    3. `revalidatePath('/')` + `redirect('/')`.
  - `cancelImport(importId)`:
    1. Update import status to `cancelled`.
    2. `redirect('/')`.

### Checkpoint

- Upload CSV → lands on preview screen → see grouped add/update/archive sections.
- Edit a field (e.g. change auditorium on Spider-Man) → edit persists in client state.
- Approve → Supabase table editor confirms the edited value was saved → home screen shows updated schedule.
- Upload again → Cancel → home screen unchanged.

---

## Phase 5 — Styling Pass

One pass, no component library.

### Claude

- `app/globals.css`:
  - CSS custom properties: one background, one surface, one accent (e.g. `--accent: #e85d04`), text scale.
  - Base reset + `font-family: system-ui`.
- Layout: `app/layout.tsx` — narrow centered column, simple nav bar with app name + sign-out.
- Table: clean rows, subtle borders, monospace for times.
- Preview screen: color-coded sections (green for add, amber for update, red/muted for archive). Field diffs show old value struck-through next to new value.
- Login page: centered card, minimal.

### Checkpoint

App looks intentional. No layout overflow. Readable on a laptop screen.

---

## Phase 6 — Manual E2E Test Walkthroughs

### Claude

Writes `docs/03-test-walkthroughs.md` with step-by-step scripts covering:

1. **Sign in / sign out** — correct credentials, wrong credentials, session persistence on refresh.
2. **View schedule** — sort by each column, filter by movie title, filter by format.
3. **Upload CSV (happy path)** — upload the spec's "New Partner Drop", verify preview groups, approve, verify home screen.
4. **Upload CSV with edits** — upload, edit one field in the preview, approve, verify the edited value is in DB.
5. **Upload and cancel** — verify schedule is unchanged.
6. **Duplicate deduplication** — upload the spec CSV (Kung Fu Panda appears twice), verify only one row created.
7. **Clear schedule** — click clear, confirm all rows archived in Supabase, home table empty.
8. **Re-upload after clear** — upload a CSV to a now-empty schedule, all rows treated as adds.

---

## File Map (end state)

```
app/
  lib/supabase/
    client.ts          ← createBrowserClient
    server.ts          ← createServerClient (async, cookies)
  actions/
    auth.ts            ← signIn, signOut
    import.ts          ← createImport, saveAndApply, cancelImport
    schedule.ts        ← clearSchedule
  login/
    page.tsx
  upload/
    page.tsx
  imports/[id]/preview/
    page.tsx           ← server component
    PreviewClient.tsx  ← client component, editable state
  page.tsx             ← home, server component
  layout.tsx
  globals.css
  types/
    database.ts        ← generated, do not edit
middleware.ts
```
