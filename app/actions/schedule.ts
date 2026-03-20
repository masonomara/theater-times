'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function clearSchedule(theaterId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.rpc('clear_schedule', {
    p_theater_id: theaterId,
    p_user_id: user.id,
  })

  revalidatePath('/')
}
