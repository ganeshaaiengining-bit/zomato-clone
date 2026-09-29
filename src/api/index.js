/* =============================================================================
   Data layer entry point

   Firebase config hai → Firebase adapter (Firestore + Auth + Storage)
   Nahi hai         → local adapter (localStorage + seed data = "demo mode")

   UI is module se sirf `useApi()` ke through baat karta hai, isliye components
   ko backend ka pata bhi nahi chalta (see context/DataContext.jsx).
   ========================================================================== */

import { isFirebaseConfigured } from '../config/firebase'
import * as localApi from './localApi'

/** Config hone par Firebase adapter load karo, warna local demo data. */
export async function initApi() {
  if (!isFirebaseConfigured) return localApi
  try {
    // dynamic import: Firebase config na hone par uska code load hi nahi hota
    const mod = await import('./firebaseApi')
    return mod
  } catch (err) {
    console.error('FoodieZone: Firebase load failed — demo mode par fallback', err)
    return localApi
  }
}

export { isFirebaseConfigured }
