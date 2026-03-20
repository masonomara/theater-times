'use client'

import { useState, useRef, DragEvent } from 'react'
import { createImport } from '@/app/actions/import'

export default function DropZone({ error }: { error?: string }) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function applyFile(f: File) {
    if (!f.name.endsWith('.csv')) return
    // Set file onto the hidden input so FormData picks it up on submit
    const dt = new DataTransfer()
    dt.items.add(f)
    if (inputRef.current) inputRef.current.files = dt.files
    setFile(f)
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) applyFile(dropped)
  }

  function onInputChange() {
    const picked = inputRef.current?.files?.[0]
    if (picked) applyFile(picked)
  }

  return (
    <form ref={formRef} action={createImport}>
      {/* Drag-and-drop target */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${isDragging ? '#000' : '#aaa'}`,
          borderRadius: 8,
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragging ? '#f5f5f5' : 'transparent',
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        {file ? (
          <>
            <p style={{ fontWeight: 600 }}>{file.name}</p>
            <p style={{ color: '#666', fontSize: 14 }}>
              {(file.size / 1024).toFixed(1)} KB — click or drop to replace
            </p>
          </>
        ) : (
          <>
            <p style={{ fontWeight: 600 }}>Drop a CSV file here</p>
            <p style={{ color: '#666', fontSize: 14 }}>or click to browse</p>
          </>
        )}
      </div>

      {/* Hidden input — name="file" is what the server action reads */}
      <input
        ref={inputRef}
        type="file"
        name="file"
        accept=".csv"
        required
        onChange={onInputChange}
        style={{ display: 'none' }}
      />

      {error && <p role="alert" style={{ color: 'red' }}>{decodeURIComponent(error)}</p>}

      <button type="submit" disabled={!file}>
        Upload and preview
      </button>
    </form>
  )
}
