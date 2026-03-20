# Theater Times

## Context

We power showtimes for local theaters. Partners send periodic CSV drops of showtimes. Files are messy: inconsistent casing, stray whitespace, duplicate rows, and slightly different spellings for the same movie. But we’d still like to build an app to be able to manage these showtimes and accommodate our partners

## Goal

- Build a small admin website to ingest a partner’s CSV and reconcile it against the current schedule for a single theater using React or Next.js.
- Show a “Preview changes” screen that groups actions before applying:
  - Add new showtimes
  - Update changed showtimes (field-level diffs)
  - Archive showtimes no longer present in the latest drop
- Show a table with the current available showtimes, sort by and filter
- Clear schedule action that resets the table’s state back to empty

## Users

**Admin:**

- Admins are theater workers who need normalized times and a aschedule for everythign they are showing.
- They need to upload new data sets (the data sets wil be normalized). THis inclides new showtimes, changed showtimes, and archiving showtimes that are no longer present int he altest drop.
- they need to be able to view all existing data
- they need to be able to clear the schedule
- all users have access to the same data table of existing data

## Flows

**Admins - Submitting new data**

1. Admins log into the app
2. Admins can view existing data on the homescreen
3. Admins can submit new data via CSV
4. Admins can see the "normalized" data utput from whatever they submit
5. Admins approve/edit before it "replaces" the existing data

## Screens

**Homescreen**

Screen that admins start at, can see the existing data and have an options to submit new data

**data Submission Screen**

A drag and drop / submit file button that collects csv files

**Data normalization sceen**

After an admin submits the data, they see it laoding, and then ont hsi screen they see the normalized data. users can edit/approve this normalized data

_once a user approves the data, this data *replaces* the "existing data". Make sure a version of the old existing data is saved in archive_

**Sign in sign ups creen**

simplce and clear

## Success

Whena. suer can submit new data, they can edit/view the normalization, and they can see the new repalced data ont eh homescreen

## Key Mutations

- transformation of existing data to new data
- admin transforming data before approving in the normalization screen


## Key Objects

**Existing Data**

The lsit of all showtimes and details. include data in **Existing Dataset** below

## Key Server Fucntions

Data needs to be normalized before presented ont he data normalization screen


## Sample Data

**“Existing” Dataset**

| theater_name | movie_title | auditorium | start_time | end_time | language | format | rating | last_updated |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Downtown Cinema 7 | Spider‑Man: Homecoming | Auditorium 1 | 2025-03-15T18:00:00Z | 2025-03-15T20:13:00Z | EN | 2D | PG-13 | 2025-03-10T12:00:00Z |
| Downtown Cinema 7 | Inside Out 2 | Auditorium 2 | 2025-03-15T17:30:00Z | 2025-03-15T19:20:00Z | EN | 3D | PG | 2025-03-10T12:00:00Z |
| Downtown Cinema 7 | Dune: Part Two | Auditorium 1 | 2025-03-15T20:00:00Z | 2025-03-15T22:46:00Z | EN | 2D | PG-13 | 2025-03-10T12:00:00Z |
| Downtown Cinema 7 | Dune: Part Two | Auditorium 1 | 2025-03-15T22:45:00Z | 2025-03-16T01:31:00Z | EN | 2D | PG-13 | 2025-03-10T12:00:00Z |
| Downtown Cinema 7 | Wonka | Auditorium 3 | 2025-03-15T16:00:00Z | 2025-03-15T17:56:00Z | EN | 2D | PG | 2025-03-10T12:00:00Z |
| Downtown Cinema 7 | Oppenheimer | Auditorium 4 | 2025-03-15T21:00:00Z | 2025-03-16T00:00:00Z | EN | IMAX | PG-13 | 2025-03-10T12:00:00Z |

**New Partner Drop**

| theater_name | movie_title | auditorium | start_time | end_time | language | format | rating | last_updated |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Downtown Cinema 7 |   Spider Man - Homecoming   | Aud 1 | 2025-03-15T18:00:00Z | 2025-03-15T20:13:00Z | EN | 2D | PG-13 | 2025-03-15T09:00:00Z |
| Downtown Cinema 7 | Inside   Out  2 | Auditorium Two | 2025-03-15T17:30:00Z | 2025-03-15T19:20:00Z | EN | 3D | PG | 2025-03-15T09:00:00Z |
| Downtown Cinema 7 | DUNE PART 2 | Auditorium 1 (Laser) | 2025-03-15T20:00:00Z | 2025-03-15T22:46:00Z | EN | IMAX | PG-13 | 2025-03-15T09:00:00Z |
| Downtown Cinema 7 | Dune: Part Two  | Auditorium 1 | 2025-03-15T22:45:00Z | 2025-03-16T01:31:00Z | EN | 2D | PG-13 | 2025-03-15T09:00:00Z |
| Downtown Cinema 7 | Kung Fu Panda 4 | Auditorium 5 | 2025-03-15T18:30:00Z | 2025-03-15T20:10:00Z | EN | 2D | PG | 2025-03-15T09:00:00Z |
| Downtown Cinema 7 | Kung Fu Panda 4 | Auditorium 5 | 2025-03-15T18:30:00Z | 2025-03-15T20:10:00Z | EN | 2D | PG | 2025-03-15T09:00:00Z |

### Differences (expected outcome)

- Adds (1)
    - Kung Fu Panda 4 — 2025-03-15 18:30–20:10, Auditorium 5, EN, 2D, PG
- Updates (4)
    - Spider‑Man: Homecoming (normalized from “Spider Man - Homecoming”) — 18:00–20:13
        - auditorium: Auditorium 1 → Aud 1 (rename/alias)
        - title: punctuation/whitespace/case normalized
        - last_updated: 2025-03-10T12:00:00Z → 2025-03-15T09:00:00Z
    - Inside Out 2 (normalized from “Inside Out 2”) — 17:30–19:20
        - auditorium: Auditorium 2 → Auditorium Two (rename)
        - title: whitespace normalized
        - last_updated: 2025-03-10T12:00:00Z → 2025-03-15T09:00:00Z
    - Dune: Part Two (normalized from “DUNE PART 2”) — 20:00–22:46
        - format: 2D → IMAX
        - auditorium: Auditorium 1 → Auditorium 1 (Laser)
        - title: case/punctuation normalized
        - last_updated: 2025-03-10T12:00:00Z → 2025-03-15T09:00:00Z
    - Dune: Part Two — 22:45–01:31
        - title: trailing space normalized
        - last_updated: 2025-03-10T12:00:00Z → 2025-03-15T09:00:00Z
- Archives (2)
    - Wonka — 16:00–17:56 (missing in new drop)
    - Oppenheimer — 21:00–00:00 (missing in new drop)
- Duplicate rows in new drop
    - Kung Fu Panda 4 at 18:30 appears twice; ingest should dedupe and create a single showtime.


## COntraints

- At any moment, there should be at most one active showtime per unique movie and start time at this theater.
- If a showtime is present in the new drop but with minor differences (e.g., title spelling, auditorium rename), treat it as an update to the same underlying showtime rather than a new one.
- If a previously active showtime no longer appears in the new drop, archive it.
- Schedule must be able to be stored and persisted in a DB
