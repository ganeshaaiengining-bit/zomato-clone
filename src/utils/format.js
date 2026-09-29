/* =============================================================================
   Formatting helpers — pure functions, koi React dependency nahi
   ========================================================================== */

/** 1299 → "₹1,299"  (Indian grouping, decimals hata dete hain) */
export function formatCurrency(value) {
  const amount = Number(value) || 0
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

/** 1500 minutes → "1 hr 50 min", 45 → "45 min" */
export function formatDuration(minutes) {
  const total = Number(minutes) || 0
  const hours = Math.floor(total / 60)
  const mins = total % 60
  if (hours && mins) return `${hours} hr ${mins} min`
  if (hours) return `${hours} hr`
  return `${mins} min`
}

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

/** Timestamp | ISO string | Date → "12 Oct 2026, 7:45 pm" */
export function formatDateTime(value) {
  if (!value) return ''
  const date = toDate(value)
  if (!date) return ''
  return `${dateFormatter.format(date)}, ${timeFormatter.format(date)}`
}

/** Timestamp | ISO string | Date → "12 Oct 2026" */
export function formatDate(value) {
  if (!value) return ''
  const date = toDate(value)
  return date ? dateFormatter.format(date) : ''
}

/** Firestore Timestamp ya Date/ISO sab normalize karta hai */
export function toDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate() // Firestore Timestamp
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** "just now" / "5 min ago" / "3 days ago" */
export function timeAgo(value) {
  const date = toDate(value)
  if (!date) return ''
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  return dateFormatter.format(date)
}

/** Slug: "Spice Garden" → "spice-garden" */
export function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Cart maths — single jagah, taaki UI aur tests same numbers milein */
export function calculateCartTotals(items = []) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const deliveryFee = items.length ? 29 : 0
  const taxes = Math.round(subtotal * 0.05)
  const discount = Math.round(subtotal * 0.1)
  return {
    itemCount: items.reduce((sum, item) => sum + item.qty, 0),
    subtotal,
    deliveryFee,
    taxes,
    discount,
    total: Math.max(0, subtotal + deliveryFee + taxes - discount),
  }
}

/** Phone number → tel: link */
export function toTelLink(phone) {
  return `tel:${String(phone || '').replace(/[^\d+]/g, '')}`
}
