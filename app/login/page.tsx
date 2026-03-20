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
    <div className="auth-page">
      <div className="auth-card">
        <h1>Theater Times</h1>
        <form className="auth-form" action={isSignUp ? signUp : signIn}>
          <div className="form-field">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              name="email"
              required
              autoComplete="email"
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              name="password"
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </div>
          {error && <p className="alert-error" role="alert">{decodeURIComponent(error)}</p>}
          <button type="submit" className="btn btn-primary">
            {isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <div className="auth-toggle">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button type="button" onClick={() => setMode(isSignUp ? 'signin' : 'signup')}>
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  )
}
