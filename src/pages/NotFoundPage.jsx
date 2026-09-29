import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui'

export default function NotFoundPage () {
  return (
    <div className="fz-container fz-page">
      <EmptyState
        icon="🧭"
        title="404 — Page not found"
        message="Ye page nahi mila. Ho sakta hai link purana ho."
        action={
          <Link className="fz-btn fz-btn--primary" to="/">
            Back to home
          </Link>
        }
      />
    </div>
  )
}
