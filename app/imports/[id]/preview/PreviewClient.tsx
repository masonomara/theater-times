'use client'

import { useState, useTransition } from 'react'
import { saveAndApply, cancelImport } from '@/app/actions/import'
import { ImportRowWithShowtime } from './page'

type NormalizedRow = Record<string, string>
type FieldDiffs = Record<string, { old: string; new: string }>

const ALL_FIELDS = [
  'movie_title', 'auditorium', 'start_time', 'end_time',
  'language', 'format', 'rating', 'last_updated',
] as const

const LABELS: Record<string, string> = {
  movie_title: 'Movie', auditorium: 'Auditorium',
  start_time: 'Start', end_time: 'End',
  language: 'Lang', format: 'Format',
  rating: 'Rating', last_updated: 'Last Updated',
}

type Props = {
  importId: string
  adds: ImportRowWithShowtime[]
  updates: ImportRowWithShowtime[]
  archives: ImportRowWithShowtime[]
}

export default function PreviewClient({ importId, adds, updates, archives }: Props) {
  const [isPending, startTransition] = useTransition()

  const [editState, setEditState] = useState<Record<string, NormalizedRow>>(() => {
    const init: Record<string, NormalizedRow> = {}
    for (const row of [...adds, ...updates]) {
      init[row.id] = { ...(row.normalized as NormalizedRow) }
    }
    return init
  })

  function updateField(rowId: string, field: string, value: string) {
    setEditState(prev => ({ ...prev, [rowId]: { ...prev[rowId], [field]: value } }))
  }

  function handleApprove() {
    startTransition(async () => {
      const edits = Object.entries(editState).map(([id, normalized]) => ({ id, normalized }))
      await saveAndApply(importId, edits)
    })
  }

  function handleCancel() {
    startTransition(async () => { await cancelImport(importId) })
  }

  return (
    <div>
      {/* ── Adds ── */}
      {adds.length > 0 && (
        <section className="preview-section section-add">
          <div className="section-header">
            <h2>Add</h2>
            <span className="badge badge-add">{adds.length}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>{ALL_FIELDS.map(f => <th key={f}>{LABELS[f]}</th>)}</tr>
              </thead>
              <tbody>
                {adds.map(row => (
                  <tr key={row.id}>
                    {ALL_FIELDS.map(f => (
                      <td key={f}>
                        <input
                          className="cell-input"
                          value={editState[row.id]?.[f] ?? ''}
                          onChange={e => updateField(row.id, f, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Updates ── */}
      {updates.length > 0 && (
        <section className="preview-section section-update">
          <div className="section-header">
            <h2>Update</h2>
            <span className="badge badge-update">{updates.length}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Movie</th>
                  <th>Start</th>
                  <th>Field</th>
                  <th>Old</th>
                  <th>New</th>
                </tr>
              </thead>
              <tbody>
                {updates.flatMap(row => {
                  const diffs = (row.field_diffs ?? {}) as FieldDiffs
                  const diffEntries = Object.entries(diffs)
                  if (diffEntries.length === 0) return []
                  return diffEntries.map(([field, { old: oldVal }], i) => (
                    <tr key={`${row.id}-${field}`}>
                      {i === 0 && (
                        <>
                          <td rowSpan={diffEntries.length}>
                            {(row.normalized as NormalizedRow).movie_title}
                          </td>
                          <td rowSpan={diffEntries.length} className="td-mono">
                            {(row.normalized as NormalizedRow).start_time}
                          </td>
                        </>
                      )}
                      <td>{LABELS[field] ?? field}</td>
                      <td><s className="diff-old">{oldVal}</s></td>
                      <td>
                        <input
                          className="cell-input"
                          value={editState[row.id]?.[field] ?? ''}
                          onChange={e => updateField(row.id, field, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Archives ── */}
      {archives.length > 0 && (
        <section className="preview-section section-archive">
          <div className="section-header">
            <h2>Archive</h2>
            <span className="badge badge-archive">{archives.length}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Movie</th>
                  <th>Auditorium</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Format</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {archives.map(row => {
                  const s = row.showtime
                  return (
                    <tr key={row.id}>
                      <td>{s?.movie_title}</td>
                      <td>{s?.auditorium}</td>
                      <td className="td-mono">{s?.start_time}</td>
                      <td className="td-mono">{s?.end_time}</td>
                      <td>{s?.format}</td>
                      <td>{s?.rating ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Actions ── */}
      <div className="preview-actions">
        <button className="btn btn-ghost" onClick={handleCancel} disabled={isPending}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleApprove} disabled={isPending}>
          {isPending ? 'Applying…' : 'Approve →'}
        </button>
      </div>
    </div>
  )
}
