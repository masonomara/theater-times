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
    <main>
      <header>
        <h1>{theater?.name ?? 'Theater Times'}</h1>
        <div>
          <a href="/upload">Upload new drop</a>
          <form action={clearWithTheater} style={{ display: 'inline' }}>
            <button type="submit">Clear schedule</button>
          </form>
          <form action={signOut} style={{ display: 'inline' }}>
            <button type="submit">Sign out</button>
          </form>
        </div>
      </header>

      <ShowtimesTable showtimes={showtimes ?? []} />
    </main>
  )
}
