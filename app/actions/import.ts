'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Tables } from '@/app/types/database'

type Showtime = Tables<'showtimes'>
type RawRow = Record<string, string>

// ── CSV parsing ────────────────────────────────────────────────────────────────

function parseCSV(text: string): RawRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim())
  return lines
    .slice(1)
    .filter(l => l.trim())
    .map(line => {
      const values = line.split(',').map(v => v.trim())
      return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
    })
}

function normalizeRow(row: RawRow): RawRow {
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k, (v ?? '').trim().replace(/\s+/g, ' ')])
  )
}

// ── Field-level diff ───────────────────────────────────────────────────────────

const DIFF_FIELDS = [
  'movie_title', 'auditorium', 'end_time',
  'language', 'format', 'rating', 'last_updated',
] as const

function computeDiffs(
  existing: Showtime,
  incoming: RawRow
): Record<string, { old: string; new: string }> | null {
  const diffs: Record<string, { old: string; new: string }> = {}
  for (const field of DIFF_FIELDS) {
    const oldVal = String(existing[field as keyof Showtime] ?? '')
    const newVal = incoming[field] ?? ''
    if (oldVal !== newVal) diffs[field] = { old: oldVal, new: newVal }
  }
  return Object.keys(diffs).length > 0 ? diffs : null
}

// ── Actions ────────────────────────────────────────────────────────────────────

export async function createImport(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Parse CSV
  const file = formData.get('file') as File
  const text = await file.text()
  const rawRows = parseCSV(text)
  if (rawRows.length === 0) redirect('/upload?error=Empty+or+invalid+CSV')

  // 2. Normalize + deduplicate within this drop
  const seen = new Set<string>()
  const processedRows = rawRows.map(raw => {
    const normalized = normalizeRow(raw)
    const key = `${normalized.start_time}::${normalized.movie_title?.toLowerCase()}`
    const isDuplicate = seen.has(key)
    seen.add(key)
    return { raw, normalized, isDuplicate }
  })

  // 3. Fetch theater + current active showtimes
  const { data: theater } = await supabase.from('theaters').select().single()
  if (!theater) throw new Error('No theater found')

  const { data: existing } = await supabase
    .rpc('get_active_showtimes', { p_theater_id: theater.id })
  const activeShowtimes: Showtime[] = existing ?? []

  // 4. Reconcile each CSV row against the current schedule
  //    Match key: start_time (specific enough to identify a showtime slot)
  const matchedIds = new Set<string>()

  type PendingRow = {
    row_index: number
    raw_values: RawRow
    normalized: RawRow
    is_duplicate: boolean
    action: 'add' | 'update' | 'archive'
    showtime_id: string | null
    field_diffs: Record<string, { old: string; new: string }> | null
  }

  const csvRows: PendingRow[] = processedRows.map(({ raw, normalized, isDuplicate }, i) => {
    const match = activeShowtimes.find(
      s => new Date(s.start_time).getTime() === new Date(normalized.start_time).getTime()
    )
    if (match) {
      matchedIds.add(match.id)
      return {
        row_index: i,
        raw_values: raw,
        normalized,
        is_duplicate: isDuplicate,
        action: 'update',
        showtime_id: match.id,
        field_diffs: computeDiffs(match, normalized),
      }
    }
    return {
      row_index: i,
      raw_values: raw,
      normalized,
      is_duplicate: isDuplicate,
      action: 'add',
      showtime_id: null,
      field_diffs: null,
    }
  })

  // 5. Any active showtime not matched by the drop gets archived
  const archiveRows: PendingRow[] = activeShowtimes
    .filter(s => !matchedIds.has(s.id))
    .map((s, i) => ({
      row_index: processedRows.length + i,
      raw_values: {},
      normalized: {},
      is_duplicate: false,
      action: 'archive',
      showtime_id: s.id,
      field_diffs: null,
    }))

  // 6. Insert import record
  const { data: importRecord, error: importErr } = await supabase
    .from('imports')
    .insert({
      theater_id: theater.id,
      filename: file.name,
      status: 'pending',
      created_by: user.id,
    })
    .select()
    .single()

  if (importErr || !importRecord) throw new Error('Failed to create import record')

  // 7. Bulk-insert all rows
  const { error: rowsErr } = await supabase.from('import_rows').insert(
    [...csvRows, ...archiveRows].map(r => ({ ...r, import_id: importRecord.id }))
  )
  if (rowsErr) throw new Error('Failed to insert import rows')

  // 8. Advance to previewing
  await supabase
    .from('imports')
    .update({ status: 'previewing' })
    .eq('id', importRecord.id)

  redirect(`/imports/${importRecord.id}/preview`)
}

export async function applyImport(importId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.rpc('apply_import', {
    p_import_id: importId,
    p_user_id: user.id,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/')
  redirect('/')
}

export async function saveAndApply(
  importId: string,
  edits: { id: string; normalized: Record<string, string> }[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Persist any edits the user made to the normalized values
  await Promise.all(
    edits.map(({ id, normalized }) =>
      supabase.from('import_rows').update({ normalized }).eq('id', id)
    )
  )

  const { error } = await supabase.rpc('apply_import', {
    p_import_id: importId,
    p_user_id: user.id,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/')
  redirect('/')
}

export async function cancelImport(importId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('imports')
    .update({ status: 'cancelled' })
    .eq('id', importId)

  redirect('/')
}
