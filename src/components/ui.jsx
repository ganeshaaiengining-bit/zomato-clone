/* =============================================================================
   Small shared UI pieces — Rating, Stars, VegMark, PriceLevel, EmptyState,
   Spinner, SkeletonCard, SectionTitle, QtyStepper
   ========================================================================== */

import { memo } from 'react'
import { formatCurrency } from '../utils/format'
import './ui.css'

/* ------------------------------------------------------------------ rating */
export const Rating = memo(function Rating ({ value = 0, count, size = 'md' }) {
  const label = Number(value || 0).toFixed(1)
  return (
    <span className="fz-rating" data-size={size} title={`${label} out of 5`}>
      <strong>{label}</strong>
      {count != null && <span className="fz-rating__count">{count} ratings</span>}
      <StarFilled />
    </span>
  )
})

export function Stars ({ value = 0, size = 16 }) {
  return (
    <span className="fz-stars" style={{ '--fz-star-size': `${size}px` }} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(value) ? 'is-on' : 'is-off'} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  )
}

export function StarFilled () {
  return (
    <svg className="fz-star-filled" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5l2.9 5.9 6.6 1-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-1z" />
    </svg>
  )
}

/* ---------------------------------------------------------------- veg / veg */
export function VegMark ({ veg }) {
  return (
    <span className={`fz-veg ${veg ? 'is-veg' : 'is-nonveg'}`} title={veg ? 'Veg' : 'Non-veg'}>
      <span className="fz-veg__dot" />
    </span>
  )
}

/* ------------------------------------------------------------- price level */
export function PriceLevel ({ level = 1 }) {
  const dots = [1, 2, 3, 4]
  return (
    <span className="fz-price-level" title={`Price level ${level} of 4`}>
      {dots.map((n) => (
        <span key={n} className={n <= level ? 'is-on' : 'is-off'} />
      ))}
    </span>
  )
}

/* ----------------------------------------------------------------- qty step */
export function QtyStepper ({ qty, onDecrease, onIncrease, label = 'quantity' }) {
  return (
    <div className="fz-stepper" role="group" aria-label={label}>
      <button type="button" onClick={onDecrease} aria-label="Decrease quantity">
        −
      </button>
      <span aria-live="polite">{qty}</span>
      <button type="button" onClick={onIncrease} aria-label="Increase quantity">
        +
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ states */
export function Spinner ({ size = 24, label = 'Loading' }) {
  return (
    <span className="fz-spinner" style={{ width: size, height: size }} role="status" aria-label={label} />
  )
}

export function PageLoader ({ label = 'Loading…' }) {
  return (
    <div className="fz-page-loader">
      <Spinner size={34} />
      <p>{label}</p>
    </div>
  )
}

export function SkeletonCard () {
  return (
    <div className="fz-skeleton-card" aria-hidden="true">
      <div className="fz-skeleton fz-skeleton-card__img" />
      <div className="fz-skeleton fz-skeleton-card__line" />
      <div className="fz-skeleton fz-skeleton-card__line short" />
      <div className="fz-skeleton fz-skeleton-card__line tiny" />
    </div>
  )
}

export function EmptyState ({ icon = '🍽️', title, message, action }) {
  return (
    <div className="fz-empty">
      <span className="fz-empty__icon" aria-hidden="true">
        {icon}
      </span>
      <h3>{title}</h3>
      {message && <p className="fz-muted">{message}</p>}
      {action}
    </div>
  )
}

export function SectionTitle ({ title, subtitle, action }) {
  return (
    <div className="fz-section-title">
      <div>
        <h2 className="fz-h2">{title}</h2>
        {subtitle && <p className="fz-muted fz-small">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/* ------------------------------------------------------------------ price */
export function Price ({ value, mrp }) {
  const discount = mrp && mrp > value ? Math.round((1 - value / mrp) * 100) : 0
  return (
    <span className="fz-price">
      <strong>{formatCurrency(value)}</strong>
      {discount > 0 && (
        <>
          <s>{formatCurrency(mrp)}</s>
          <em className="fz-price__off">{discount}% off</em>
        </>
      )}
    </span>
  )
}
