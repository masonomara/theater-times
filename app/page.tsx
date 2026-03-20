import { createClient } from '@/app/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import ShowtimesTable from '@/app/components/ShowtimesTable'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: theater } = await supabase
    .from('theaters')
    .select()
    .single()

  const { data: showtimes } = await supabase
    .rpc('get_active_showtimes', { p_theater_id: theater!.id })

  return (
    <main>
      <header>
        <h1>{theater?.name ?? 'Theater Times'}</h1>
        <form action={signOut}>
          <button type="submit">Sign out</button>
        </form>
      </header>

      <ShowtimesTable showtimes={showtimes ?? []} />
    </main>
  )
}
