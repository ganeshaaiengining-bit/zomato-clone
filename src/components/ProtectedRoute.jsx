import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from './ui'

/**
 * Route guard.
 * @param {boolean} adminOnly  true ho to sirf admin user
 * @param {ReactNode} children
 */
export default function ProtectedRoute ({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader label="Checking your session…" />

  if (!user) {
    // wapas jahan se aaye the wahi bhej do (login ke baad)
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="fz-container fz-page">
        <h1 className="fz-h1">403 — Admin access only</h1>
        <p className="fz-muted">
          Ye page sirf admin ke liye hai. Apna email <code>.env</code> ke{' '}
          <code>VITE_ADMIN_EMAILS</code> list me add karein.
        </p>
      </div>
    )
  }

  return children
}
