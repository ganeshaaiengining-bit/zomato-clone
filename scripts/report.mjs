/**
 * Admin report — Firestore se current data ka snapshot (verification ke liye)
 *
 *   node scripts/report.mjs [adminEmail] [adminPassword]
 *
 * Ye script admin email se login karke Firestore REST API se data padhta hai:
 *   - restaurants + unke dishes ka count
 *   - orders (status, customer, totals ke saath)
 *   - reviews count
 *
 * Admin panel ki jagliye ye seed se zyada reliable source-of-truth hai.
 */

const env = await loadEnv()
const [, , emailArg = env.VITE_ADMIN_EMAILS?.split(',')[0], passwordArg] = process.argv

const API_KEY = env.VITE_FIREBASE_API_KEY
const DOCS = 'projects/zomato-clone-88cd1/databases/(default)/documents'

async function loadEnv () {
  const fs = await import('node:fs/promises')
  const text = await fs.readFile(new URL('../.env', import.meta.url), 'utf8').catch(() => '')
  return Object.fromEntries(
    text
      .split('\n')
      .filter((line) => line.includes('=') && !line.trim().startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=')
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
      }),
  )
}

if (!API_KEY) {
  console.error('❌ .env me VITE_FIREBASE_API_KEY missing hai')
  process.exit(1)
}
if (!emailArg || !passwordArg) {
  console.error('❌ Usage: node scripts/report.mjs <adminEmail> <password>')
  process.exit(1)
}

const authRes = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailArg, password: passwordArg, returnSecureToken: true }),
  },
)
const auth = await authRes.json()
if (!authRes.ok) {
  console.error(`❌ Login fail: ${auth?.error?.message}`)
  process.exit(1)
}
console.log(`\n🔐 Admin login OK → ${emailArg} (uid: ${auth.localId})\n`)

const list = async (collection) => {
  const res = await fetch(`https://firestore.googleapis.com/v1/${DOCS}/${collection}?key=${API_KEY}`, {
    headers: { Authorization: `Bearer ${auth.idToken}` },
  })
  const data = await res.json()
  if (!res.ok) {
    console.error(`❌ ${collection} read fail: ${data?.error?.message}`)
    return []
  }
  return data.documents || []
}

/** "projects/.../documents/restaurants/burger-point" → "burger-point" */
const docId = (doc) => doc.name.split('/').pop()

const get = (fields, key, fallback = '—') => {
  const v = fields?.[key]
  if (!v) return fallback
  if (v.timestampValue) return new Date(v.timestampValue).toLocaleString('en-IN')
  return v.stringValue ?? v.integerValue ?? v.doubleValue ?? v.booleanValue ?? fallback
}

const restaurants = await list('restaurants')
const orders = await list('orders')

console.log('🏪 RESTAURANTS')
console.log('─'.repeat(72))
let dishTotal = 0
for (const doc of restaurants) {
  const id = docId(doc)
  const items = await list(`restaurants/${id}/items`)
  dishTotal += items.length
  console.log(
    `  ${get(doc.fields, 'name', id).padEnd(22)} ${get(doc.fields, 'rating')}/5  ` +
      `${get(doc.fields, 'deliveryTime')} min  ${items.length} dishes  ₹${get(doc.fields, 'deliveryFee')} delivery`,
  )
}
console.log(`\n  Total: ${restaurants.length} restaurants · ${dishTotal} dishes\n`)

console.log('🧾 ORDERS (Firestore me saved)')
console.log('─'.repeat(72))
if (!orders.length) console.log('  (abhi koi order nahi)')
for (const doc of orders) {
  const f = doc.fields || {}
  const id = docId(doc)
  const items = f.items?.arrayValue?.values || []
  const total = f.totals?.mapValue?.fields
  console.log(`  #${id.slice(0, 8)}  ${get(f, 'restaurantName')}`);
  console.log(
    `      customer : ${get(f, 'userName')} <${get(f, 'userEmail')}>`,
  )
  console.log(
    `      items    : ${items.length}  |  total ₹${get(total, 'total')}  |  payment: ${get(f, 'paymentMode')}`,
  )
  console.log(`      status   : ${get(f, 'status')}  |  placed: ${get(f, 'placedAt')}`);
  console.log(`      address  : ${get(f.address?.mapValue?.fields, 'line1')}, ${get(f.address?.mapValue?.fields, 'city')}`);
  console.log('')
}
console.log('─'.repeat(72))
console.log(`  Total orders: ${orders.length}\n`)
