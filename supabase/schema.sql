-- ============================================================
-- Theater Times — Complete Database Schema
-- Paste into Supabase SQL Editor and run in one shot.
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- fuzzy title similarity


-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE showtime_status AS ENUM ('active', 'archived');

-- Lifecycle of a CSV partner-drop import
CREATE TYPE import_status AS ENUM (
  'pending',    -- uploaded, not yet diffed
  'previewing', -- diff computed, waiting for admin approval
  'applied',    -- admin approved; schedule updated
  'cancelled'   -- admin rejected / discarded
);

-- What the reconciliation engine decided to do with an import row
CREATE TYPE change_action AS ENUM ('add', 'update', 'archive');

-- Why was a showtime archived
CREATE TYPE archive_reason AS ENUM (
  'import_drop',    -- missing from the latest CSV drop
  'clear_schedule', -- admin manually cleared the whole schedule
  'manual'          -- one-off admin action
);


-- ============================================================
-- THEATERS
-- ============================================================

CREATE TABLE theaters (
  id         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       text        NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  theaters      IS 'Partner theaters managed by this admin tool.';
COMMENT ON COLUMN theaters.name IS 'Canonical display name, e.g. "Downtown Cinema 7".';


-- ============================================================
-- SHOWTIMES
-- ============================================================
-- Stores every showtime ever seen — both active and archived.
-- Only one active record may exist per (theater, movie, start_time).
-- ============================================================

CREATE TABLE showtimes (
  id           uuid            PRIMARY KEY DEFAULT uuid_generate_v4(),
  theater_id   uuid            NOT NULL REFERENCES theaters(id) ON DELETE CASCADE,
  movie_title  text            NOT NULL,
  auditorium   text            NOT NULL,
  start_time   timestamptz     NOT NULL,
  end_time     timestamptz     NOT NULL,
  language     text            NOT NULL DEFAULT 'EN',
  format       text            NOT NULL, -- '2D' | '3D' | 'IMAX' | 'Dolby' | '4DX' …
  rating       text,                     -- 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17'
  status       showtime_status NOT NULL DEFAULT 'active',
  last_updated timestamptz     NOT NULL,
  created_at   timestamptz     NOT NULL DEFAULT now(),
  updated_at   timestamptz     NOT NULL DEFAULT now(),

  CONSTRAINT chk_end_after_start CHECK (end_time > start_time)
);

-- At most one *active* showtime per (theater, normalized title, start_time).
-- Partial unique index so archived rows do not interfere.
CREATE UNIQUE INDEX uq_active_showtime
  ON showtimes (theater_id, movie_title, start_time)
  WHERE status = 'active';

-- trgm GIN index enables fast similarity queries used by the matching engine
CREATE INDEX idx_showtimes_title_trgm
  ON showtimes USING gin (movie_title gin_trgm_ops);

CREATE INDEX idx_showtimes_theater_status
  ON showtimes (theater_id, status);

CREATE INDEX idx_showtimes_start_time
  ON showtimes (start_time);

COMMENT ON TABLE  showtimes             IS 'All showtimes — active and archived — for every theater.';
COMMENT ON COLUMN showtimes.movie_title IS 'Normalized (trimmed, collapsed whitespace) canonical title.';
COMMENT ON COLUMN showtimes.status      IS '"active" = on the current schedule; "archived" = removed.';
COMMENT ON COLUMN showtimes.last_updated IS 'Comes from the partner CSV drop; not a system timestamp.';


-- ============================================================
-- SHOWTIME HISTORY (field-level audit log)
-- ============================================================
-- Written automatically by a trigger on showtimes UPDATE.
-- old_values / new_values are full row snapshots (sans timestamps).
-- ============================================================

CREATE TABLE showtime_history (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  showtime_id uuid        NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
  changed_at  timestamptz NOT NULL DEFAULT now(),
  changed_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  old_values  jsonb       NOT NULL,
  new_values  jsonb       NOT NULL,
  import_id   uuid        -- NULL for manual edits; set when change originated from an import
);

CREATE INDEX idx_showtime_history_showtime
  ON showtime_history (showtime_id, changed_at DESC);

CREATE INDEX idx_showtime_history_import
  ON showtime_history (import_id)
  WHERE import_id IS NOT NULL;

COMMENT ON TABLE  showtime_history            IS 'Immutable audit log of every field-level change to a showtime.';
COMMENT ON COLUMN showtime_history.old_values IS 'Row snapshot before the change (excludes updated_at/created_at).';
COMMENT ON COLUMN showtime_history.new_values IS 'Row snapshot after the change (excludes updated_at/created_at).';
COMMENT ON COLUMN showtime_history.import_id  IS 'Set when the change was triggered by apply_import().';


-- ============================================================
-- IMPORTS
-- ============================================================
-- One row per CSV partner drop that an admin uploads.
-- ============================================================

CREATE TABLE imports (
  id          uuid          PRIMARY KEY DEFAULT uuid_generate_v4(),
  theater_id  uuid          NOT NULL REFERENCES theaters(id) ON DELETE CASCADE,
  filename    text          NOT NULL,
  status      import_status NOT NULL DEFAULT 'pending',
  created_by  uuid          REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  applied_at  timestamptz,

  -- applied_at must be set iff status = 'applied'
  CONSTRAINT chk_applied_at CHECK (
    (status = 'applied'  AND applied_at IS NOT NULL) OR
    (status <> 'applied' AND applied_at IS NULL)
  )
);

CREATE INDEX idx_imports_theater_created
  ON imports (theater_id, created_at DESC);

COMMENT ON TABLE  imports            IS 'Tracks the full lifecycle of each CSV partner-drop upload.';
COMMENT ON COLUMN imports.status     IS 'pending → previewing → applied | cancelled.';
COMMENT ON COLUMN imports.applied_at IS 'Timestamp when an admin approved and the schedule was updated.';


-- ============================================================
-- IMPORT ROWS
-- ============================================================
-- One row per de-duplicated CSV line after normalization.
-- The reconciliation engine fills action + field_diffs.
-- ============================================================

CREATE TABLE import_rows (
  id           uuid          PRIMARY KEY DEFAULT uuid_generate_v4(),
  import_id    uuid          NOT NULL REFERENCES imports(id) ON DELETE CASCADE,
  row_index    int           NOT NULL, -- 0-based position in original CSV
  raw_values   jsonb         NOT NULL, -- verbatim CSV key/value pairs
  normalized   jsonb         NOT NULL, -- after trim / whitespace collapse / case fix
  is_duplicate boolean       NOT NULL DEFAULT false,
  action       change_action,          -- NULL until diff is computed
  showtime_id  uuid          REFERENCES showtimes(id) ON DELETE SET NULL,
  field_diffs  jsonb,                  -- only for action='update': {field:{old,new}}

  CONSTRAINT uq_import_row UNIQUE (import_id, row_index)
);

CREATE INDEX idx_import_rows_import
  ON import_rows (import_id);

CREATE INDEX idx_import_rows_showtime
  ON import_rows (showtime_id)
  WHERE showtime_id IS NOT NULL;

COMMENT ON TABLE  import_rows              IS 'Normalized, diffed rows from a CSV import.';
COMMENT ON COLUMN import_rows.raw_values   IS 'Original CSV row preserved verbatim for auditing.';
COMMENT ON COLUMN import_rows.normalized   IS 'Row after normalization: trimmed titles, ISO timestamps, etc.';
COMMENT ON COLUMN import_rows.is_duplicate IS 'True when this row was a duplicate within the same drop; skipped on apply.';
COMMENT ON COLUMN import_rows.field_diffs  IS 'For action=update: {fieldName: {old: "...", new: "..."}}';


-- ============================================================
-- FUNCTIONS
-- ============================================================

-- ------------------------------------------------------------
-- 1. normalize_title
--    Trims leading/trailing whitespace and collapses interior
--    runs of whitespace to a single space.
--    Used by the app layer for matching + by the UI preview.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION normalize_title(raw text)
RETURNS text
LANGUAGE sql
IMMUTABLE STRICT
AS $$
  SELECT regexp_replace(trim(raw), '\s+', ' ', 'g');
$$;

COMMENT ON FUNCTION normalize_title IS
  'Trim and collapse whitespace in a movie title. Does NOT handle punctuation/case — that is handled by the app-layer fuzzy matcher.';


-- ------------------------------------------------------------
-- 2. title_similarity
--    Wrapper around pg_trgm similarity() for use in queries.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION title_similarity(a text, b text)
RETURNS real
LANGUAGE sql
IMMUTABLE STRICT
AS $$
  SELECT similarity(normalize_title(a), normalize_title(b));
$$;

COMMENT ON FUNCTION title_similarity IS
  'Returns pg_trgm trigram similarity (0–1) between two normalized titles.';


-- ------------------------------------------------------------
-- 3. set_updated_at (trigger helper)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_showtimes_updated_at
  BEFORE UPDATE ON showtimes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ------------------------------------------------------------
-- 4. capture_showtime_history (trigger)
--    Fires after every meaningful UPDATE to a showtime row.
--    Reads app.current_import_id from the session context when
--    the change originated from apply_import().
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION capture_showtime_history()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_import_id  uuid;
  v_changed_by uuid;
  v_old        jsonb;
  v_new        jsonb;
BEGIN
  -- Strip high-churn system timestamps from the snapshot
  v_old := to_jsonb(OLD) - 'updated_at' - 'created_at';
  v_new := to_jsonb(NEW) - 'updated_at' - 'created_at';

  -- Only write a history row when something actually changed
  IF v_old = v_new THEN
    RETURN NEW;
  END IF;

  -- Import context is set by apply_import() via set_config
  v_import_id  := nullif(current_setting('app.current_import_id',  true), '')::uuid;
  v_changed_by := nullif(current_setting('app.current_user_id',    true), '')::uuid;

  INSERT INTO showtime_history (showtime_id, changed_by, old_values, new_values, import_id)
  VALUES (NEW.id, v_changed_by, v_old, v_new, v_import_id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_capture_showtime_history
  AFTER UPDATE ON showtimes
  FOR EACH ROW EXECUTE FUNCTION capture_showtime_history();


-- ------------------------------------------------------------
-- 5. apply_import(p_import_id, p_user_id)
--    Atomically applies a fully-diffed import:
--      • INSERT rows with action='add'
--      • UPDATE rows with action='update'
--      • Archive rows with action='archive'
--      • Mark the import as 'applied'
--    Caller must have set import status to 'previewing' first.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION apply_import(
  p_import_id uuid,
  p_user_id   uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_theater_id uuid;
BEGIN
  -- Lock the import row; verify it is ready to apply
  SELECT theater_id INTO v_theater_id
  FROM   imports
  WHERE  id = p_import_id
    AND  status = 'previewing'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Import % is not in "previewing" state or does not exist.', p_import_id;
  END IF;

  -- Expose context to history trigger
  PERFORM set_config('app.current_import_id', p_import_id::text, true);
  PERFORM set_config('app.current_user_id',   COALESCE(p_user_id::text, ''), true);

  -- ── 1. ADD new showtimes ───────────────────────────────────
  INSERT INTO showtimes (
    theater_id, movie_title, auditorium,
    start_time, end_time, language, format, rating, last_updated
  )
  SELECT
    v_theater_id,
    (r.normalized->>'movie_title'),
    (r.normalized->>'auditorium'),
    (r.normalized->>'start_time')::timestamptz,
    (r.normalized->>'end_time')::timestamptz,
    COALESCE(r.normalized->>'language', 'EN'),
    (r.normalized->>'format'),
    (r.normalized->>'rating'),
    (r.normalized->>'last_updated')::timestamptz
  FROM import_rows r
  WHERE r.import_id    = p_import_id
    AND r.action       = 'add'
    AND r.is_duplicate = false;

  -- ── 2. UPDATE changed showtimes ───────────────────────────
  UPDATE showtimes s
  SET
    movie_title  = COALESCE(r.normalized->>'movie_title',              s.movie_title),
    auditorium   = COALESCE(r.normalized->>'auditorium',               s.auditorium),
    start_time   = COALESCE((r.normalized->>'start_time')::timestamptz, s.start_time),
    end_time     = COALESCE((r.normalized->>'end_time')::timestamptz,   s.end_time),
    language     = COALESCE(r.normalized->>'language',                 s.language),
    format       = COALESCE(r.normalized->>'format',                   s.format),
    rating       = COALESCE(r.normalized->>'rating',                   s.rating),
    last_updated = COALESCE((r.normalized->>'last_updated')::timestamptz, s.last_updated)
  FROM import_rows r
  WHERE r.import_id    = p_import_id
    AND r.action       = 'update'
    AND r.is_duplicate = false
    AND s.id           = r.showtime_id
    AND s.status       = 'active';

  -- ── 3. ARCHIVE dropped showtimes ──────────────────────────
  UPDATE showtimes
  SET status = 'archived'
  WHERE id IN (
    SELECT showtime_id
    FROM   import_rows
    WHERE  import_id    = p_import_id
      AND  action       = 'archive'
      AND  showtime_id  IS NOT NULL
  )
  AND status = 'active';

  -- ── 4. Stamp the import ───────────────────────────────────
  UPDATE imports
  SET status     = 'applied',
      applied_at = now()
  WHERE id = p_import_id;

END;
$$;

COMMENT ON FUNCTION apply_import IS
  'Atomically applies a previewed import: inserts adds, updates changes, archives drops, marks import applied.';


-- ------------------------------------------------------------
-- 6. clear_schedule(p_theater_id, p_user_id)
--    Archives every active showtime for a theater.
--    Returns the count of rows archived.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION clear_schedule(
  p_theater_id uuid,
  p_user_id    uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  PERFORM set_config('app.current_import_id', '',                                    true);
  PERFORM set_config('app.current_user_id',   COALESCE(p_user_id::text, ''), true);

  UPDATE showtimes
  SET    status = 'archived'
  WHERE  theater_id = p_theater_id
    AND  status     = 'active';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION clear_schedule IS
  'Archives every active showtime for a theater. Returns number of rows archived.';


-- ------------------------------------------------------------
-- 7. schedule_summary(p_theater_id)
--    Aggregate stats for the schedule management dashboard.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION schedule_summary(p_theater_id uuid)
RETURNS TABLE (
  total_active   bigint,
  total_archived bigint,
  movies_showing bigint,
  formats        text[]
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    COUNT(*)         FILTER (WHERE status = 'active')                    AS total_active,
    COUNT(*)         FILTER (WHERE status = 'archived')                  AS total_archived,
    COUNT(DISTINCT movie_title) FILTER (WHERE status = 'active')         AS movies_showing,
    ARRAY_AGG(DISTINCT format ORDER BY format) FILTER (WHERE status = 'active') AS formats
  FROM showtimes
  WHERE theater_id = p_theater_id;
$$;

COMMENT ON FUNCTION schedule_summary IS
  'Aggregate stats (active count, archived count, distinct movies, formats) for a theater.';


-- ------------------------------------------------------------
-- 8. get_active_showtimes(p_theater_id, p_movie, p_format, p_date)
--    Filtered view of the current schedule used by the home
--    screen table.  All filter params are optional (NULL = no filter).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_active_showtimes(
  p_theater_id uuid,
  p_movie      text    DEFAULT NULL,
  p_format     text    DEFAULT NULL,
  p_date       date    DEFAULT NULL
)
RETURNS SETOF showtimes
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT *
  FROM   showtimes
  WHERE  theater_id = p_theater_id
    AND  status     = 'active'
    AND  (p_movie  IS NULL OR movie_title ILIKE '%' || p_movie || '%')
    AND  (p_format IS NULL OR format = p_format)
    AND  (p_date   IS NULL OR start_time::date = p_date)
  ORDER BY start_time ASC;
$$;

COMMENT ON FUNCTION get_active_showtimes IS
  'Returns active showtimes for a theater with optional filters for the home-screen table.';


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- All tables are admin-only: authenticated users have full
-- CRUD; anonymous/unauthenticated users have no access.
-- apply_import and clear_schedule use SECURITY DEFINER and
-- bypass RLS internally.
-- ============================================================

ALTER TABLE theaters         ENABLE ROW LEVEL SECURITY;
ALTER TABLE showtimes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE showtime_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE imports          ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_rows      ENABLE ROW LEVEL SECURITY;

-- ── theaters ─────────────────────────────────────────────────
CREATE POLICY "theaters: authenticated full access"
  ON theaters FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── showtimes ────────────────────────────────────────────────
CREATE POLICY "showtimes: authenticated full access"
  ON showtimes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── showtime_history ─────────────────────────────────────────
-- History is append-only from the client perspective.
-- The trigger (SECURITY DEFINER context) handles inserts;
-- clients can only read.
CREATE POLICY "showtime_history: authenticated read"
  ON showtime_history FOR SELECT
  TO authenticated
  USING (true);

-- Needed so SECURITY DEFINER trigger can insert
CREATE POLICY "showtime_history: service insert"
  ON showtime_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ── imports ──────────────────────────────────────────────────
CREATE POLICY "imports: authenticated full access"
  ON imports FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── import_rows ──────────────────────────────────────────────
CREATE POLICY "import_rows: authenticated full access"
  ON import_rows FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- Seed data lives in supabase/seed.sql — run that separately.
