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
      <div
        className="dropzone"
        data-dragging={isDragging.toString()}
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {file ? (
          <>
            <p className="dropzone-title">{file.name}</p>
            <p className="dropzone-sub">
              {(file.size / 1024).toFixed(1)} KB — click or drop to replace
            </p>
          </>
        ) : (
          <>
            <p className="dropzone-title">Drop a CSV file here</p>
            <p className="dropzone-sub">or click to browse</p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        name="file"
        accept=".csv"
        required
        onChange={onInputChange}
        style={{ display: 'none' }}
      />

      {error && (
        <p className="alert-error" role="alert" style={{ marginBottom: '0.75rem' }}>
          {decodeURIComponent(error)}
        </p>
      )}

      <button type="submit" className="btn btn-primary" disabled={!file}>
        Upload and preview
      </button>
    </form>
  )
}
