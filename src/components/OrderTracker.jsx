import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '../data/seed'
import { formatDateTime } from '../utils/format'
import './OrderTracker.css'

export default function OrderTracker ({ status = 'placed', placedAt }) {
  if (status === 'cancelled') {
    return (
      <div className="fz-tracker fz-tracker--cancelled">
        <strong>Order cancelled</strong>
        <span className="fz-small fz-muted">Refund (if paid) will reflect in 3-5 business days.</span>
      </div>
    )
  }

  const currentIndex = Math.max(0, ORDER_STATUSES.indexOf(status))

  return (
    <div className="fz-tracker">
      <ol>
        {ORDER_STATUSES.map((step, index) => (
          <li
            key={step}
            className={index < currentIndex ? 'is-done' : index === currentIndex ? 'is-current' : ''}
            aria-current={index === currentIndex ? 'step' : undefined}
          >
            <span className="fz-tracker__dot" aria-hidden="true" />
            <span className="fz-tracker__label">{ORDER_STATUS_LABELS[step]}</span>
          </li>
        ))}
      </ol>
      {placedAt && <p className="fz-small fz-muted">Ordered {formatDateTime(placedAt)}</p>}
    </div>
  )
}
