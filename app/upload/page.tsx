import DropZone from './DropZone'

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main>
      <a href="/">← Back</a>
      <h1>Upload Partner Drop</h1>
      <DropZone error={error} />
    </main>
  )
}
