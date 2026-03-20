import { signIn } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main>
      <h1>Theater Times</h1>
      <form action={signIn}>
        <label>
          Email
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </label>
        {error && <p role="alert">{decodeURIComponent(error)}</p>}
        <button type="submit">Sign in</button>
      </form>
    </main>
  )
}
