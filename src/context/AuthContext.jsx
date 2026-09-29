/* =============================================================================
   AuthContext — Firebase Auth (ya demo login)
   Expose: user, loading, isAdmin, signIn, signUp, signInGoogle, signOut
   ========================================================================== */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useData } from './DataContext'
import { adminEmails } from '../config/firebase'

const AuthContext = createContext(null)

export function AuthProvider ({ children }) {
  const { api, ready } = useData()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready || !api) return undefined
    const unsubscribe = api.onAuthChange((nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
    return () => unsubscribe?.()
  }, [api, ready])

  const signIn = useCallback((email, password) => api.signInWithEmail(email, password), [api])
  const signUp = useCallback((name, email, password) => api.signUpWithEmail(email, password, name), [api])
  const signInGoogle = useCallback(() => api.signInWithGoogle(), [api])
  const signOut = useCallback(() => api.signOutUser(), [api])

  const isAdmin = useMemo(() => {
    if (!user?.email) return false
    if (user.isAdmin) return true
    // demo (local) mode: admin@… se login karne par admin panel khul jata hai
    if (user.isDemo) return user.email.toLowerCase().startsWith('admin')
    return adminEmails.includes(user.email.toLowerCase())
  }, [user])

  const value = useMemo(
    () => ({ user, loading, isAdmin, signIn, signUp, signInGoogle, signOut }),
    [user, loading, isAdmin, signIn, signUp, signInGoogle, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth ko AuthProvider ke andar use karein')
  return ctx
}
