/* =============================================================================
   Firebase bootstrap (modular SDK v12+)

   - Keys `.env` se aati hain (sirf VITE_ prefix wali keys client me hoti hain)
   - App tabhi initialize hota hai jab saari required keys mojood hon
   - Nahi to app "demo mode" me chalta hai (localStorage adapter) — UI test/review
     kar sakte ho bina Firebase ke
   ========================================================================== */

import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// keys ka placeholder .env.example me hota hai — unhe valid na maano
const PLACEHOLDER = /^(your-|\s*$)/

export const isFirebaseConfigured = ['apiKey', 'projectId', 'appId'].every((key) => {
  const value = firebaseConfig[key]
  return Boolean(value) && !PLACEHOLDER.test(String(value))
})

// UI me admin badge dikhane ke liye (rules me bhi sync rakhein)
export const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

let services = null

/** Firebase services (auth / firestore / storage) — memoized. */
export function getFirebase() {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase config missing. `.env` me VITE_FIREBASE_* values daalein (README dekhein).',
    )
  }
  if (!services) {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
    services = {
      app,
      auth: getAuth(app),
      db: getFirestore(app),
      storage: getStorage(app),
    }
  }
  return services
}
