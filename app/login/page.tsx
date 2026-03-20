'use client'

import { useState } from 'react'
import { signIn, signUp } from './actions'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const isSignUp = mode === 'signup'

  return (
    <main>
      <h1>Theater Times</h1>
      <form action={isSignUp ? signUp : signIn}>
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
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
          />
        </label>
        {error && <p role="alert">{decodeURIComponent(error)}</p>}
        <button type="submit">{isSignUp ? 'Create account' : 'Sign in'}</button>
      </form>
      <button type="button" onClick={() => setMode(isSignUp ? 'signin' : 'signup')}>
        {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
      </button>
    </main>
  )
}
