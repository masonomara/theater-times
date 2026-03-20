import { createClient } from '@/app/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import { clearSchedule } from '@/app/actions/schedule'
import ShowtimesTable from '@/app/components/ShowtimesTable'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: theater } = await supabase
    .from('theaters')
    .select()
    .single()

  const { data: showtimes } = await supabase
    .rpc('get_active_showtimes', { p_theater_id: theater!.id })

  const clearWithTheater = clearSchedule.bind(null, theater!.id)

  return (
    <main className="page">
      <header className="page-header">
        <h1>{theater?.name ?? 'Theater Times'}</h1>
        <div className="header-actions">
          <a href="/upload" className="btn btn-primary">Upload new drop</a>
          <form action={clearWithTheater}>
            <button type="submit" className="btn btn-ghost">Clear schedule</button>
          </form>
          <form action={signOut}>
            <button type="submit" className="btn btn-ghost">Sign out</button>
          </form>
        </div>
      </header>

      <ShowtimesTable showtimes={showtimes ?? []} />
    </main>
  )
}
