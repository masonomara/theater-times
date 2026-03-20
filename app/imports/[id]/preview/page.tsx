import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tables } from '@/app/types/database'
import PreviewClient from './PreviewClient'

export type ImportRowWithShowtime = Tables<'import_rows'> & {
  showtime: Tables<'showtimes'> | null
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: importRecord } = await supabase
    .from('imports')
    .select()
    .eq('id', id)
    .single()

  // Redirect if the import isn't in a previewable state
  if (!importRecord || importRecord.status !== 'previewing') redirect('/')

  const { data: rows } = await supabase
    .from('import_rows')
    .select()
    .eq('import_id', id)
    .eq('is_duplicate', false)
    .order('row_index')

  // Fetch showtimes for update/archive rows (needed to show old values)
  const showtimeIds = (rows ?? [])
    .filter(r => r.showtime_id)
    .map(r => r.showtime_id!)

  const { data: showtimes } = showtimeIds.length > 0
    ? await supabase.from('showtimes').select().in('id', showtimeIds)
    : { data: [] }

  const showtimeMap = Object.fromEntries((showtimes ?? []).map(s => [s.id, s]))

  const rowsWithShowtimes: ImportRowWithShowtime[] = (rows ?? []).map(r => ({
    ...r,
    showtime: r.showtime_id ? (showtimeMap[r.showtime_id] ?? null) : null,
  }))

  const adds    = rowsWithShowtimes.filter(r => r.action === 'add')
  const updates = rowsWithShowtimes.filter(r => r.action === 'update')
  const archives = rowsWithShowtimes.filter(r => r.action === 'archive')

  return (
    <main>
      <a href="/">← Back</a>
      <h1>Preview changes</h1>
      <p>{importRecord.filename}</p>
      <PreviewClient
        importId={id}
        adds={adds}
        updates={updates}
        archives={archives}
      />
    </main>
  )
}
