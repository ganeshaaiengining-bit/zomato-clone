import { useToast } from '../context/ToastContext'
import './Toasts.css'

const ICONS = {
  success: '✓',
  error: '!',
  info: 'i',
}

export default function Toasts () {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fz-toasts" role="region" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className={`fz-toast fz-toast--${toast.type}`}
          onClick={() => dismiss(toast.id)}
        >
          <span className="fz-toast__icon" aria-hidden="true">
            {ICONS[toast.type] || ICONS.info}
          </span>
          <span>{toast.message}</span>
        </button>
      ))}
    </div>
  )
}
