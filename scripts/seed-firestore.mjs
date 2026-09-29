/**
 * One-time setup script — Firebase REST API se (browser se nahi, isliye network issues se free)
 *
 *   node scripts/seed-firestore.mjs
 *
 * Kya karta hai:
 *   1. Admin user banata hai (agar nahi hai) → idToken
 *   2. Seed data Firestore me likhta hai:
 *        restaurants/{id}
 *        restaurants/{id}/items/{itemId}
 *        restaurants/{id}/reviews/{userId}
 *
 * Ye script Firebase CLI (already logged in) ki jagah use hota hai — kyunki
 * browser se seed karne ke liye app me login karna padta. Rules ke mutabik
 * sirf admin email hi likh sakti hai.
 */

// ---------------------------------------------------------------- config
const env = await loadEnv()
const API_KEY = env.VITE_FIREBASE_API_KEY
const PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID
const ADMIN_EMAIL = env.VITE_ADMIN_EMAILS
const ADMIN_PASSWORD = process.argv[2] || 'FoodieZone@2026'

if (!API_KEY || !PROJECT_ID || !ADMIN_EMAIL) {
  console.error('❌ .env me VITE_FIREBASE_API_KEY / PROJECT_ID / ADMIN_EMAILS chahiye')
  process.exit(1)
}

const AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1'
const DATABASE = 'projects/zomato-clone-88cd1/databases/(default)/documents'
const FS_BASE = `https://firestore.googleapis.com/v1/${DATABASE}`

/* ------------------------------------------------------------------ helpers */
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

async function signInOrCreate () {
  const payload = { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, returnSecureToken: true }

  const trySignIn = await fetch(`${AUTH_BASE}/accounts:signInWithPassword?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (trySignIn.ok) return trySignIn.json()

  // user nahi hai → bana do
  const created = await fetch(`${AUTH_BASE}/accounts:signUp?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, displayName: 'FoodieZone Admin' }),
  })

  if (!created.ok) {
    throw new Error(`Auth failed: ${created.status} ${(await created.text()).slice(0, 300)}`)
  }
  return created.json()
}

/** Firestore REST: document fields ko typed values me convert karo */
function encodeValue (value) {
  if (value === null || value === undefined) return { nullValue: null }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
  if (typeof value === 'string') return { stringValue: value }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } }
  if (value instanceof Date) return { timestampValue: value.toISOString() }
  return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encodeValue(v)])) } }
}

function documentBody (fields) {
  return { fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, encodeValue(v)])) }
}

async function commit (idToken, writes) {
  // Firestore batch endpoint har write me full document path maangta hai
  const withPaths = writes.map((write) => ({
    update: {
      name: `${DATABASE}/${write.update.name}`,
      fields: write.update.fields,
    },
  }))

  const response = await fetch(`${FS_BASE}:commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ writes: withPaths }),
  })
  if (!response.ok) {
    throw new Error(`Commit failed: ${response.status} ${(await response.text()).slice(0, 400)}`)
  }
}

/* --------------------------------------------------------------------- run */
const auth = await signInOrCreate()
console.log(`✅ Admin user ready: ${auth.email} (uid: ${auth.localId})`)

const { seedRestaurants, seedReviews } = await import('../src/data/seed.js')

let written = 0

for (const restaurant of seedRestaurants) {
  const { items = [], ...rest } = restaurant
  // menuCategories restaurant document me hi array ke roop me rehti hai
  // (app wahi read karti hai — alag subcollection ki zarurat nahi)
  const writes = [
    { update: { name: `restaurants/${restaurant.id}`, fields: documentBody(rest).fields } },
    ...items.map((item) => ({
      update: { name: `restaurants/${restaurant.id}/items/${item.id}`, fields: documentBody(item).fields },
    })),
  ]

  await commit(auth.idToken, writes)
  written += writes.length
  console.log(`  ✔ ${restaurant.name} (${items.length} dishes)`)
}

if (seedReviews.length) {
  await commit(
    auth.idToken,
    seedReviews.map((review) => ({
      update: {
        name: `restaurants/${review.restaurantId}/reviews/${review.userId}`,
        fields: documentBody(review).fields,
      },
    })),
  )
  written += seedReviews.length
  console.log(`  ✔ ${seedReviews.length} reviews`)
}

console.log(`\n🎉 Firestore me ${written} records likh diye. App ab live data dikhayegi.`)
