import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { Spinner } from '../components/ui'
import './LoginPage.css'

export default function LoginPage () {
  const { signIn, signUp, signInGoogle } = useAuth()
  const { isDemo } = useData()
  const { success, error: toastError } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'

  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const setField = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }))

  async function submit (event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'signup') {
        await signUp(form.name.trim(), form.email.trim(), form.password)
      } else {
        await signIn(form.email.trim(), form.password)
      }
      success(mode === 'signup' ? 'Account created — welcome!' : 'Logged in')
      navigate(from, { replace: true })
    } catch (err) {
      const message = friendlyError(err)
      setError(message)
      toastError(message)
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle () {
    setError('')
    setBusy(true)
    try {
      await signInGoogle()
      success('Signed in with Google')
      navigate(from, { replace: true })
    } catch (err) {
      const message = friendlyError(err)
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fz-auth">
      <div className="fz-auth__art" aria-hidden="true">
        <span>🍜</span>
        <span>🍔</span>
        <span>🍕</span>
      </div>

      <div className="fz-card fz-auth__card">
        <h1 className="fz-h2">
          {mode === 'signup' ? 'Create your account' : 'Log in to FoodieZone'}
        </h1>
        <p className="fz-muted fz-small">
          {mode === 'signup'
            ? 'Order faster, save addresses and track your deliveries.'
            : 'Continue where you left off — your cart and orders are waiting.'}
        </p>

        <div className="fz-auth__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            className={mode === 'signin' ? 'is-active' : ''}
            onClick={() => setMode('signin')}
          >
            Log in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            className={mode === 'signup' ? 'is-active' : ''}
            onClick={() => setMode('signup')}
          >
            Sign up
          </button>
        </div>

        <form className="fz-auth__form" onSubmit={submit}>
          {mode === 'signup' && (
            <label className="fz-field">
              <span className="fz-label">Full name</span>
              <input className="fz-input" value={form.name} onChange={setField('name')} required />
            </label>
          )}

          <label className="fz-field">
            <span className="fz-label">Email</span>
            <input
              className="fz-input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={setField('email')}
              required
            />
          </label>

          <label className="fz-field">
            <span className="fz-label">Password</span>
            <input
              className="fz-input"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              placeholder="At least 6 characters"
              value={form.password}
              onChange={setField('password')}
              required
              minLength={6}
            />
          </label>

          {error && <p className="fz-auth__error">{error}</p>}

          <button className="fz-btn fz-btn--primary fz-btn--block" type="submit" disabled={busy}>
            {busy ? <Spinner size={16} /> : mode === 'signup' ? 'Create account' : 'Log in'}
          </button>
        </form>

        <div className="fz-auth__or">
          <span>or</span>
        </div>

        <button className="fz-btn fz-btn--subtle fz-btn--block" type="button" onClick={handleGoogle} disabled={busy}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A12 12 0 0 0 12 24Z"
            />
            <path fill="#FBBC05" d="M5.6 14.7a7.2 7.2 0 0 1 0-4.6v-3H1.8a12 12 0 0 0 0 10.6l3.8-3Z" />
            <path
              fill="#EA4335"
              d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3A12 12 0 0 0 1.8 6.1l3.8 3C6.5 6.9 9 4.8 12 4.8Z"
            />
          </svg>
          Continue with Google
        </button>

        {isDemo && (
          <p className="fz-auth__demo">
            Demo mode me koi bhi email + 6 character ka password kaam karega.{' '}
            <strong>Admin panel</strong> ke liye <code>admin@foodiezone.app</code> se login karein.
            Firebase connect karne ke liye <code>.env</code> me keys daalein.
          </p>
        )}

        <p className="fz-auth__foot fz-small fz-muted">
          <Link to="/search">Continue browsing without logging in →</Link>
        </p>
      </div>
    </div>
  )
}

/* Firebase auth errors ko friendly message me badal do */
function friendlyError (error) {
  const code = error?.code || ''
  const map = {
    'auth/invalid-email': 'Email sahi nahi hai',
    'auth/user-not-found': 'Ye email pehle se registered nahi hai',
    'auth/wrong-password': 'Password galat hai',
    'auth/invalid-credential': 'Email ya password galat hai',
    'auth/email-already-in-use': 'Ye email already registered hai',
    'auth/weak-password': 'Password kam se kam 6 characters ka rakhein',
    'auth/popup-closed-by-user': 'Google sign-in cancel kar diya',
    'auth/too-many-requests': 'Bahut zyada try kiya — thodi der baad karein',
  }
  return map[code] || error?.message || 'Something went wrong — please try again'
}
