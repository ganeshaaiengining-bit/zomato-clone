/**
 * Admin user creator — Firebase Auth (REST API, browser ki zarurat nahi)
 *
 *   node scripts/create-admin.mjs <email> <password>
 *   node scripts/create-admin.mjs jion@doe.com john@doe
 *
 * Agar user pehle se hai to password update kar deta hai (signIn + setPassword).
 * Naya user bana deta hai aur displayName set karta hai.
 *
 * NOTE: Firestore rules me bhi ye email ADMIN list me honi chahiye
 * (firestore.rules > isAdmin()) — warna panel data read/write nahi kar payega.
 */

const [, , emailArg, passwordArg] = process.argv

if (!emailArg || !passwordArg) {
  console.error('❌ Usage: node scripts/create-admin.mjs <email> <password>')
  process.exit(1)
}
if (passwordArg.length < 6) {
  console.error('❌ Password kam se kam 6 characters ka rakhein')
  process.exit(1)
}

const env = await loadEnv()
const API_KEY = env.VITE_FIREBASE_API_KEY
const AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1'

if (!API_KEY) {
  console.error('❌ .env me VITE_FIREBASE_API_KEY missing hai')
  process.exit(1)
}

/** Admin list .env aur rules se check karo (mismatch = permission denied at runtime) */
function checkAdminList (targetEmail) {
  const list = (env.VITE_ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  const ok = list.includes(targetEmail.toLowerCase())
  if (!ok) {
    console.warn('⚠️  Ye email .env ke VITE_ADMIN_EMAILS me nahi hai — Firestore rules me bhi daalein')
  }
  return ok
}

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

async function api (path, body) {
  const response = await fetch(`${AUTH_BASE}/${path}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  return { ok: response.ok, status: response.status, data }
}

const displayName = emailArg.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

// 1) pehle se user hai? → password update
const signIn = await api('accounts:signInWithPassword', {
  email: emailArg,
  password: passwordArg,
  returnSecureToken: true,
})

if (signIn.ok) {
  await api('accounts:update', { idToken: signIn.data.idToken, displayName })
  console.log(`✅ User pehle se tha, login + displayName update ho gaya: ${emailArg}`)
} else {
  // 2) naya user banao
  const created = await api('accounts:signUp', {
    email: emailArg,
    password: passwordArg,
    returnSecureToken: true,
  })

  if (!created.ok) {
    const message = created.data?.error?.message || 'unknown error'
    console.error(`❌ User create nahi hua (${created.status}): ${message}`)
    if (message.includes('EMAIL_EXISTS')) {
      console.error('   → Ye email already registered hai, par password alag hai.')
      console.error('   → Firebase console → Authentication → Users se password reset karein.')
    }
    process.exit(1)
  }

  await api('accounts:update', { idToken: created.data.idToken, displayName })
  console.log(`✅ Naya admin user ban gaya: ${emailArg}  (uid: ${created.data.localId})`)
}

checkAdminList(emailArg)
console.log('\nLogin karke test karein:')
console.log(`   Email:    ${emailArg}`)
console.log(`   Password: ${passwordArg}`)
