'use client'

import { useState, useMemo } from 'react'
import { Tables } from '@/app/types/database'

type Showtime = Tables<'showtimes'>

type SortKey = 'movie_title' | 'auditorium' | 'start_time' | 'end_time' | 'format' | 'rating' | 'last_updated'
type SortDir = 'asc' | 'desc'

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export default function ShowtimesTable({ showtimes }: { showtimes: Showtime[] }) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('start_time')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const rows = useMemo(() => {
    const filtered = query
      ? showtimes.filter(s =>
          s.movie_title.toLowerCase().includes(query.toLowerCase())
        )
      : showtimes

    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [showtimes, query, sortKey, sortDir])

  function ColHeader({ label, col }: { label: string; col: SortKey }) {
    const active = sortKey === col
    return (
      <th onClick={() => toggleSort(col)} style={{ cursor: 'pointer', userSelect: 'none' }}>
        {label}{active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
      </th>
    )
  }

  return (
    <div>
      <input
        type="search"
        placeholder="Filter by title…"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <p>{rows.length} showtime{rows.length !== 1 ? 's' : ''}</p>
      <table>
        <thead>
          <tr>
            <ColHeader label="Movie" col="movie_title" />
            <ColHeader label="Auditorium" col="auditorium" />
            <ColHeader label="Start" col="start_time" />
            <ColHeader label="End" col="end_time" />
            <ColHeader label="Format" col="format" />
            <ColHeader label="Rating" col="rating" />
            <ColHeader label="Last Updated" col="last_updated" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7}>No showtimes found.</td>
            </tr>
          ) : (
            rows.map(s => (
              <tr key={s.id}>
                <td>{s.movie_title}</td>
                <td>{s.auditorium}</td>
                <td>{fmt(s.start_time)}</td>
                <td>{fmt(s.end_time)}</td>
                <td>{s.format}</td>
                <td>{s.rating ?? '—'}</td>
                <td>{fmt(s.last_updated)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
