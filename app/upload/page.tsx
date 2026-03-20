import DropZone from './DropZone'

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="page">
      <a href="/" className="back-link">← Back</a>
      <div className="upload-content">
        <h1>Upload Partner Drop</h1>
        <DropZone error={error} />
      </div>
    </main>
  )
}
