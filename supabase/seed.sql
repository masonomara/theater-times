-- ============================================================
-- Theater Times — Seed Data
-- Run AFTER schema.sql.
-- Safe to re-run: all inserts use ON CONFLICT DO NOTHING.
-- ============================================================


-- ============================================================
-- THEATER
-- ============================================================

INSERT INTO theaters (id, name, created_at)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Downtown Cinema 7',
  '2025-01-10T09:00:00Z'
)
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- ACTIVE SHOWTIMES  (current schedule — "existing dataset")
-- These match the spec baseline exactly.
-- ============================================================

WITH t AS (SELECT id AS tid FROM theaters WHERE name = 'Downtown Cinema 7')
INSERT INTO showtimes (
  id, theater_id, movie_title, auditorium,
  start_time, end_time, language, format, rating,
  status, last_updated, created_at, updated_at
)
SELECT s.id, tid, s.movie_title, s.auditorium,
       s.start_time, s.end_time, s.language, s.format, s.rating,
       s.status, s.last_updated, s.created_at, s.updated_at
FROM t, (VALUES

  -- ── Active block ──────────────────────────────────────────
  (
    'b1000000-0000-0000-0000-000000000001'::uuid,
    'Spider-Man: Homecoming', 'Auditorium 1',
    '2025-03-15T18:00:00Z'::timestamptz, '2025-03-15T20:13:00Z'::timestamptz,
    'EN', '2D', 'PG-13',
    'active'::showtime_status, '2025-03-10T12:00:00Z'::timestamptz,
    '2025-03-10T12:00:00Z'::timestamptz, '2025-03-10T12:00:00Z'::timestamptz
  ),
  (
    'b1000000-0000-0000-0000-000000000002'::uuid,
    'Inside Out 2', 'Auditorium 2',
    '2025-03-15T17:30:00Z'::timestamptz, '2025-03-15T19:20:00Z'::timestamptz,
    'EN', '3D', 'PG',
    'active'::showtime_status, '2025-03-10T12:00:00Z'::timestamptz,
    '2025-03-10T12:00:00Z'::timestamptz, '2025-03-10T12:00:00Z'::timestamptz
  ),
  (
    'b1000000-0000-0000-0000-000000000003'::uuid,
    'Dune: Part Two', 'Auditorium 1',
    '2025-03-15T20:00:00Z'::timestamptz, '2025-03-15T22:46:00Z'::timestamptz,
    'EN', '2D', 'PG-13',
    'active'::showtime_status, '2025-03-10T12:00:00Z'::timestamptz,
    '2025-03-10T12:00:00Z'::timestamptz, '2025-03-10T12:00:00Z'::timestamptz
  ),
  (
    'b1000000-0000-0000-0000-000000000004'::uuid,
    'Dune: Part Two', 'Auditorium 1',
    '2025-03-15T22:45:00Z'::timestamptz, '2025-03-16T01:31:00Z'::timestamptz,
    'EN', '2D', 'PG-13',
    'active'::showtime_status, '2025-03-10T12:00:00Z'::timestamptz,
    '2025-03-10T12:00:00Z'::timestamptz, '2025-03-10T12:00:00Z'::timestamptz
  ),
  (
    'b1000000-0000-0000-0000-000000000005'::uuid,
    'Wonka', 'Auditorium 3',
    '2025-03-15T16:00:00Z'::timestamptz, '2025-03-15T17:56:00Z'::timestamptz,
    'EN', '2D', 'PG',
    'active'::showtime_status, '2025-03-10T12:00:00Z'::timestamptz,
    '2025-03-10T12:00:00Z'::timestamptz, '2025-03-10T12:00:00Z'::timestamptz
  ),
  (
    'b1000000-0000-0000-0000-000000000006'::uuid,
    'Oppenheimer', 'Auditorium 4',
    '2025-03-15T21:00:00Z'::timestamptz, '2025-03-16T00:00:00Z'::timestamptz,
    'EN', 'IMAX', 'PG-13',
    'active'::showtime_status, '2025-03-10T12:00:00Z'::timestamptz,
    '2025-03-10T12:00:00Z'::timestamptz, '2025-03-10T12:00:00Z'::timestamptz
  )

) AS s(
  id, movie_title, auditorium,
  start_time, end_time, language, format, rating,
  status, last_updated, created_at, updated_at
)
ON CONFLICT DO NOTHING;


-- ============================================================
-- ARCHIVED SHOWTIMES  (previous week — dropped from schedule)
-- Gives the history table something to show and lets the UI
-- render the "archived" badge.
-- ============================================================

WITH t AS (SELECT id AS tid FROM theaters WHERE name = 'Downtown Cinema 7')
INSERT INTO showtimes (
  id, theater_id, movie_title, auditorium,
  start_time, end_time, language, format, rating,
  status, last_updated, created_at, updated_at
)
SELECT s.id, tid, s.movie_title, s.auditorium,
       s.start_time, s.end_time, s.language, s.format, s.rating,
       s.status, s.last_updated, s.created_at, s.updated_at
FROM t, (VALUES

  (
    'b2000000-0000-0000-0000-000000000001'::uuid,
    'The Holdovers', 'Auditorium 2',
    '2025-03-08T19:00:00Z'::timestamptz, '2025-03-08T21:28:00Z'::timestamptz,
    'EN', '2D', 'R',
    'archived'::showtime_status, '2025-03-01T12:00:00Z'::timestamptz,
    '2025-03-01T12:00:00Z'::timestamptz, '2025-03-10T12:00:00Z'::timestamptz
  ),
  (
    'b2000000-0000-0000-0000-000000000002'::uuid,
    'Poor Things', 'Auditorium 3',
    '2025-03-08T17:00:00Z'::timestamptz, '2025-03-08T19:21:00Z'::timestamptz,
    'EN', '2D', 'R',
    'archived'::showtime_status, '2025-03-01T12:00:00Z'::timestamptz,
    '2025-03-01T12:00:00Z'::timestamptz, '2025-03-10T12:00:00Z'::timestamptz
  ),
  (
    'b2000000-0000-0000-0000-000000000003'::uuid,
    'Poor Things', 'Auditorium 3',
    '2025-03-08T21:00:00Z'::timestamptz, '2025-03-08T23:21:00Z'::timestamptz,
    'EN', '2D', 'R',
    'archived'::showtime_status, '2025-03-01T12:00:00Z'::timestamptz,
    '2025-03-01T12:00:00Z'::timestamptz, '2025-03-10T12:00:00Z'::timestamptz
  ),
  (
    'b2000000-0000-0000-0000-000000000004'::uuid,
    'Dune: Part Two', 'Auditorium 1',
    '2025-03-08T20:00:00Z'::timestamptz, '2025-03-08T22:46:00Z'::timestamptz,
    'EN', 'IMAX', 'PG-13',
    'archived'::showtime_status, '2025-03-01T12:00:00Z'::timestamptz,
    '2025-03-01T12:00:00Z'::timestamptz, '2025-03-10T12:00:00Z'::timestamptz
  ),
  (
    'b2000000-0000-0000-0000-000000000005'::uuid,
    'Argylle', 'Auditorium 5',
    '2025-03-08T18:00:00Z'::timestamptz, '2025-03-08T20:19:00Z'::timestamptz,
    'EN', '2D', 'PG-13',
    'archived'::showtime_status, '2025-03-01T12:00:00Z'::timestamptz,
    '2025-03-01T12:00:00Z'::timestamptz, '2025-03-10T12:00:00Z'::timestamptz
  )

) AS s(
  id, movie_title, auditorium,
  start_time, end_time, language, format, rating,
  status, last_updated, created_at, updated_at
)
ON CONFLICT DO NOTHING;


-- ============================================================
-- PAST IMPORTS  (two completed partner drops)
-- ============================================================

-- Import 1 — the March 1 drop (already applied, produced the
-- archived showtimes above)
INSERT INTO imports (id, theater_id, filename, status, created_at, applied_at)
SELECT
  'c1000000-0000-0000-0000-000000000001',
  id,
  'downtown_cinema7_2025-03-01.csv',
  'applied',
  '2025-03-01T11:45:00Z',
  '2025-03-01T12:00:00Z'
FROM theaters WHERE name = 'Downtown Cinema 7'
ON CONFLICT DO NOTHING;

-- Import 2 — the March 10 drop (produced the current active schedule)
INSERT INTO imports (id, theater_id, filename, status, created_at, applied_at)
SELECT
  'c1000000-0000-0000-0000-000000000002',
  id,
  'downtown_cinema7_2025-03-10.csv',
  'applied',
  '2025-03-10T11:30:00Z',
  '2025-03-10T12:00:00Z'
FROM theaters WHERE name = 'Downtown Cinema 7'
ON CONFLICT DO NOTHING;


-- ============================================================
-- IMPORT ROWS for Import 2 (the March 10 drop)
-- Illustrates add / update / archive actions and a duplicate.
-- ============================================================

-- row 0 — ADD Spider-Man (new this week)
INSERT INTO import_rows (
  id, import_id, row_index,
  raw_values, normalized,
  is_duplicate, action, showtime_id, field_diffs
)
VALUES (
  'd1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000002',
  0,
  '{"theater_name":"Downtown Cinema 7","movie_title":"  Spider-Man: Homecoming ","auditorium":"Auditorium 1","start_time":"2025-03-15T18:00:00Z","end_time":"2025-03-15T20:13:00Z","language":"EN","format":"2D","rating":"PG-13","last_updated":"2025-03-10T12:00:00Z"}'::jsonb,
  '{"theater_name":"Downtown Cinema 7","movie_title":"Spider-Man: Homecoming","auditorium":"Auditorium 1","start_time":"2025-03-15T18:00:00Z","end_time":"2025-03-15T20:13:00Z","language":"EN","format":"2D","rating":"PG-13","last_updated":"2025-03-10T12:00:00Z"}'::jsonb,
  false, 'add', NULL, NULL
)
ON CONFLICT DO NOTHING;

-- row 1 — ADD Inside Out 2
INSERT INTO import_rows (
  id, import_id, row_index,
  raw_values, normalized,
  is_duplicate, action, showtime_id, field_diffs
)
VALUES (
  'd1000000-0000-0000-0000-000000000002',
  'c1000000-0000-0000-0000-000000000002',
  1,
  '{"theater_name":"Downtown Cinema 7","movie_title":"Inside   Out  2","auditorium":"Auditorium 2","start_time":"2025-03-15T17:30:00Z","end_time":"2025-03-15T19:20:00Z","language":"EN","format":"3D","rating":"PG","last_updated":"2025-03-10T12:00:00Z"}'::jsonb,
  '{"theater_name":"Downtown Cinema 7","movie_title":"Inside Out 2","auditorium":"Auditorium 2","start_time":"2025-03-15T17:30:00Z","end_time":"2025-03-15T19:20:00Z","language":"EN","format":"3D","rating":"PG","last_updated":"2025-03-10T12:00:00Z"}'::jsonb,
  false, 'add', NULL, NULL
)
ON CONFLICT DO NOTHING;

-- row 2 — ADD Dune: Part Two (early showing)
INSERT INTO import_rows (
  id, import_id, row_index,
  raw_values, normalized,
  is_duplicate, action, showtime_id, field_diffs
)
VALUES (
  'd1000000-0000-0000-0000-000000000003',
  'c1000000-0000-0000-0000-000000000002',
  2,
  '{"theater_name":"Downtown Cinema 7","movie_title":"DUNE: PART TWO","auditorium":"Auditorium 1","start_time":"2025-03-15T20:00:00Z","end_time":"2025-03-15T22:46:00Z","language":"EN","format":"2D","rating":"PG-13","last_updated":"2025-03-10T12:00:00Z"}'::jsonb,
  '{"theater_name":"Downtown Cinema 7","movie_title":"Dune: Part Two","auditorium":"Auditorium 1","start_time":"2025-03-15T20:00:00Z","end_time":"2025-03-15T22:46:00Z","language":"EN","format":"2D","rating":"PG-13","last_updated":"2025-03-10T12:00:00Z"}'::jsonb,
  false, 'add', NULL, NULL
)
ON CONFLICT DO NOTHING;

-- row 3 — ADD Dune: Part Two (late showing)
INSERT INTO import_rows (
  id, import_id, row_index,
  raw_values, normalized,
  is_duplicate, action, showtime_id, field_diffs
)
VALUES (
  'd1000000-0000-0000-0000-000000000004',
  'c1000000-0000-0000-0000-000000000002',
  3,
  '{"theater_name":"Downtown Cinema 7","movie_title":"Dune: Part Two","auditorium":"Auditorium 1","start_time":"2025-03-15T22:45:00Z","end_time":"2025-03-16T01:31:00Z","language":"EN","format":"2D","rating":"PG-13","last_updated":"2025-03-10T12:00:00Z"}'::jsonb,
  '{"theater_name":"Downtown Cinema 7","movie_title":"Dune: Part Two","auditorium":"Auditorium 1","start_time":"2025-03-15T22:45:00Z","end_time":"2025-03-16T01:31:00Z","language":"EN","format":"2D","rating":"PG-13","last_updated":"2025-03-10T12:00:00Z"}'::jsonb,
  false, 'add', NULL, NULL
)
ON CONFLICT DO NOTHING;

-- row 4 — ADD Wonka
INSERT INTO import_rows (
  id, import_id, row_index,
  raw_values, normalized,
  is_duplicate, action, showtime_id, field_diffs
)
VALUES (
  'd1000000-0000-0000-0000-000000000005',
  'c1000000-0000-0000-0000-000000000002',
  4,
  '{"theater_name":"Downtown Cinema 7","movie_title":"Wonka","auditorium":"Auditorium 3","start_time":"2025-03-15T16:00:00Z","end_time":"2025-03-15T17:56:00Z","language":"EN","format":"2D","rating":"PG","last_updated":"2025-03-10T12:00:00Z"}'::jsonb,
  '{"theater_name":"Downtown Cinema 7","movie_title":"Wonka","auditorium":"Auditorium 3","start_time":"2025-03-15T16:00:00Z","end_time":"2025-03-15T17:56:00Z","language":"EN","format":"2D","rating":"PG","last_updated":"2025-03-10T12:00:00Z"}'::jsonb,
  false, 'add', NULL, NULL
)
ON CONFLICT DO NOTHING;

-- row 5 — ADD Oppenheimer
INSERT INTO import_rows (
  id, import_id, row_index,
  raw_values, normalized,
  is_duplicate, action, showtime_id, field_diffs
)
VALUES (
  'd1000000-0000-0000-0000-000000000006',
  'c1000000-0000-0000-0000-000000000002',
  5,
  '{"theater_name":"Downtown Cinema 7","movie_title":"Oppenheimer","auditorium":"Auditorium 4","start_time":"2025-03-15T21:00:00Z","end_time":"2025-03-16T00:00:00Z","language":"EN","format":"IMAX","rating":"PG-13","last_updated":"2025-03-10T12:00:00Z"}'::jsonb,
  '{"theater_name":"Downtown Cinema 7","movie_title":"Oppenheimer","auditorium":"Auditorium 4","start_time":"2025-03-15T21:00:00Z","end_time":"2025-03-16T00:00:00Z","language":"EN","format":"IMAX","rating":"PG-13","last_updated":"2025-03-10T12:00:00Z"}'::jsonb,
  false, 'add', NULL, NULL
)
ON CONFLICT DO NOTHING;

-- row 6 — ARCHIVE The Holdovers (was in previous week, gone now)
INSERT INTO import_rows (
  id, import_id, row_index,
  raw_values, normalized,
  is_duplicate, action, showtime_id, field_diffs
)
VALUES (
  'd1000000-0000-0000-0000-000000000007',
  'c1000000-0000-0000-0000-000000000002',
  6,
  '{}'::jsonb,
  '{}'::jsonb,
  false, 'archive', 'b2000000-0000-0000-0000-000000000001', NULL
)
ON CONFLICT DO NOTHING;

-- row 7 — ARCHIVE Poor Things (17:00 showing)
INSERT INTO import_rows (
  id, import_id, row_index,
  raw_values, normalized,
  is_duplicate, action, showtime_id, field_diffs
)
VALUES (
  'd1000000-0000-0000-0000-000000000008',
  'c1000000-0000-0000-0000-000000000002',
  7,
  '{}'::jsonb,
  '{}'::jsonb,
  false, 'archive', 'b2000000-0000-0000-0000-000000000002', NULL
)
ON CONFLICT DO NOTHING;

-- row 8 — ARCHIVE Poor Things (21:00 showing)
INSERT INTO import_rows (
  id, import_id, row_index,
  raw_values, normalized,
  is_duplicate, action, showtime_id, field_diffs
)
VALUES (
  'd1000000-0000-0000-0000-000000000009',
  'c1000000-0000-0000-0000-000000000002',
  8,
  '{}'::jsonb,
  '{}'::jsonb,
  false, 'archive', 'b2000000-0000-0000-0000-000000000003', NULL
)
ON CONFLICT DO NOTHING;

-- row 9 — ARCHIVE Dune IMAX (format downgraded to 2D this week)
INSERT INTO import_rows (
  id, import_id, row_index,
  raw_values, normalized,
  is_duplicate, action, showtime_id, field_diffs
)
VALUES (
  'd1000000-0000-0000-0000-000000000010',
  'c1000000-0000-0000-0000-000000000002',
  9,
  '{}'::jsonb,
  '{}'::jsonb,
  false, 'archive', 'b2000000-0000-0000-0000-000000000004', NULL
)
ON CONFLICT DO NOTHING;

-- row 10 — ARCHIVE Argylle
INSERT INTO import_rows (
  id, import_id, row_index,
  raw_values, normalized,
  is_duplicate, action, showtime_id, field_diffs
)
VALUES (
  'd1000000-0000-0000-0000-000000000011',
  'c1000000-0000-0000-0000-000000000002',
  10,
  '{}'::jsonb,
  '{}'::jsonb,
  false, 'archive', 'b2000000-0000-0000-0000-000000000005', NULL
)
ON CONFLICT DO NOTHING;


-- ============================================================
-- SHOWTIME HISTORY  (audit entries for the March 10 import)
-- Records that the Dune IMAX showing was archived and six
-- new showtimes were created that session.
-- ============================================================

INSERT INTO showtime_history (
  showtime_id, changed_at, changed_by, old_values, new_values, import_id
)
VALUES
  -- Dune IMAX → archived
  (
    'b2000000-0000-0000-0000-000000000004',
    '2025-03-10T12:00:00Z',
    NULL,
    '{"status":"active","movie_title":"Dune: Part Two","auditorium":"Auditorium 1","format":"IMAX","rating":"PG-13"}'::jsonb,
    '{"status":"archived","movie_title":"Dune: Part Two","auditorium":"Auditorium 1","format":"IMAX","rating":"PG-13"}'::jsonb,
    'c1000000-0000-0000-0000-000000000002'
  ),
  -- The Holdovers → archived
  (
    'b2000000-0000-0000-0000-000000000001',
    '2025-03-10T12:00:00Z',
    NULL,
    '{"status":"active","movie_title":"The Holdovers","auditorium":"Auditorium 2","format":"2D","rating":"R"}'::jsonb,
    '{"status":"archived","movie_title":"The Holdovers","auditorium":"Auditorium 2","format":"2D","rating":"R"}'::jsonb,
    'c1000000-0000-0000-0000-000000000002'
  ),
  -- Poor Things (17:00) → archived
  (
    'b2000000-0000-0000-0000-000000000002',
    '2025-03-10T12:00:00Z',
    NULL,
    '{"status":"active","movie_title":"Poor Things","auditorium":"Auditorium 3","format":"2D","rating":"R"}'::jsonb,
    '{"status":"archived","movie_title":"Poor Things","auditorium":"Auditorium 3","format":"2D","rating":"R"}'::jsonb,
    'c1000000-0000-0000-0000-000000000002'
  )
ON CONFLICT DO NOTHING;
