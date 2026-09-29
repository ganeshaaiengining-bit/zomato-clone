/* =============================================================================
   FIREBASE adapter — Firestore + Auth + Storage
   Isi interface ko localApi.js implement karta hai, isliye UI code backend se
   unaware rehta hai (see src/api/index.js).

   Note: demo-scale dataset (hundreds of restaurants) me poora collection ek baar
   me lekar client-side filter karna theek hai — filter logic `utils/filters.js`
   me shared hai. Lakho records hone par `where/orderBy` server queries par shift
   karein.
   ========================================================================== */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { getFirebase } from '../config/firebase'
import { seedRestaurants, seedReviews } from '../data/seed'
import { filterRestaurants } from '../utils/filters'
import { makeId } from '../utils/id'
import { slugify } from '../utils/format'

export const backend = 'firebase'

/* --------------------------------------------------------------- serialize */
function serialize(value) {
  if (value == null) return value
  if (Array.isArray(value)) return value.map(serialize)
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') return value.toDate().toISOString()
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serialize(v)]))
  }
  return value
}

const toPlain = (snap) => serialize(snap.data())

/* -------------------------------------------------------------------- auth  */
export function onAuthChange(callback) {
  const { auth } = getFirebase()
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      callback(null)
      return
    }
    callback({
      uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'Guest',
      email: user.email,
      photoURL: user.photoURL || '',
      isAdmin: Boolean(user.email && isAdminEmail(user.email)),
    })
  })
}

function isAdminEmail(email) {
  const list = (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(String(email).toLowerCase())
}

export async function signInWithEmail(email, password) {
  const { auth } = getFirebase()
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return { uid: cred.user.uid, email: cred.user.email, name: cred.user.displayName || email }
}

export async function signUpWithEmail(email, password, name = '') {
  const { auth } = getFirebase()
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  if (name) await updateProfile(cred.user, { displayName: name })
  return { uid: cred.user.uid, email: cred.user.email, name }
}

export async function signInWithGoogle() {
  const { auth } = getFirebase()
  const cred = await signInWithPopup(auth, new GoogleAuthProvider())
  return { uid: cred.user.uid, email: cred.user.email, name: cred.user.displayName }
}

export async function signOutUser() {
  const { auth } = getFirebase()
  await signOut(auth)
}

/* ----------------------------------------------------------------- profile  */
export async function getProfile(userId) {
  const { db } = getFirebase()
  const snap = await getDoc(doc(db, 'users', userId))
  return snap.exists() ? toPlain(snap) : null
}

export async function saveProfile(userId, data) {
  const { db } = getFirebase()
  const ref = doc(db, 'users', userId)
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })
  return { ...data }
}

/* ------------------------------------------------------------- restaurants  */
export async function listRestaurants(filters = {}) {
  const { db } = getFirebase()
  const snap = await getDocs(collection(db, 'restaurants'))
  const list = snap.docs.map((d) => ({ id: d.id, ...toPlain(d) }))
  return filterRestaurants(list, filters)
}

export async function getRestaurant(id) {
  const { db } = getFirebase()
  const snap = await getDoc(doc(db, 'restaurants', id))
  if (!snap.exists()) throw new Error('Restaurant not found')
  return { id: snap.id, ...toPlain(snap) }
}

export async function getMenuItems(restaurantId) {
  const { db } = getFirebase()
  const snap = await getDocs(collection(db, 'restaurants', restaurantId, 'items'))
  return snap.docs.map((d) => ({ id: d.id, ...toPlain(d) }))
}

export async function createRestaurant(data) {
  const { db } = getFirebase()
  const id = data.id || slugify(data.name) || makeId('rst')
  await setDoc(doc(db, 'restaurants', id), {
    ...data,
    id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { ...data, id }
}

export async function updateRestaurant(id, data) {
  const { db } = getFirebase()
  await updateDoc(doc(db, 'restaurants', id), { ...data, updatedAt: serverTimestamp() })
  return { ...data, id }
}

export async function deleteRestaurant(id) {
  const { db } = getFirebase()
  await deleteDoc(doc(db, 'restaurants', id))
}

/* --------------------------------------------------------------- menu items */
export async function createMenuItem(restaurantId, data) {
  const { db } = getFirebase()
  const ref = doc(collection(db, 'restaurants', restaurantId, 'items'))
  await setDoc(ref, { ...data, id: data.id || ref.id, createdAt: serverTimestamp() })
  return { ...data }
}

export async function updateMenuItem(restaurantId, itemId, data) {
  const { db } = getFirebase()
  await updateDoc(doc(db, 'restaurants', restaurantId, 'items', itemId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
  return { ...data }
}

export async function deleteMenuItem(restaurantId, itemId) {
  const { db } = getFirebase()
  await deleteDoc(doc(db, 'restaurants', restaurantId, 'items', itemId))
}

/** Seed data ko Firestore me push karo (Admin → "Import seed data") */
export async function seedDatabase() {
  const { db } = getFirebase()
  let written = 0

  // Firestore me ek batch me 500 writes max — ek batch per restaurant (safe)
  for (const restaurant of seedRestaurants) {
    const { items = [], ...rest } = restaurant
    const batch = writeBatch(db)
    batch.set(doc(db, 'restaurants', restaurant.id), {
      ...rest,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    items.forEach((item) => {
      batch.set(doc(db, 'restaurants', restaurant.id, 'items', item.id), item)
    })
    await batch.commit()
    written += 1 + items.length
  }

  const reviewBatch = writeBatch(db)
  seedReviews.forEach((review) => {
    reviewBatch.set(doc(db, 'restaurants', review.restaurantId, 'reviews', review.userId), {
      ...review,
      createdAt: serverTimestamp(),
    })
    written += 1
  })
  await reviewBatch.commit()

  return written
}

/* ------------------------------------------------------------------ orders  */
// Firestore `undefined` value accept nahi karta — pehle undefined fields hata dete hain
function stripUndefined (value) {
  if (Array.isArray(value)) return value.map(stripUndefined)
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)]),
    )
  }
  return value
}

export async function createOrder(order) {
  const { db } = getFirebase()
  const ref = doc(collection(db, 'orders'))
  await setDoc(ref, {
    ...stripUndefined(order),
    status: order.status || 'placed',
    placedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { ...order, id: ref.id, status: order.status || 'placed' }
}

export async function listMyOrders(userId) {
  const { db } = getFirebase()
  const snap = await getDocs(
    query(collection(db, 'orders'), where('userId', '==', userId), orderBy('placedAt', 'desc')),
  )
  return snap.docs.map((d) => ({ id: d.id, ...toPlain(d) }))
}

export async function listAllOrders() {
  const { db } = getFirebase()
  const snap = await getDocs(
    query(collection(db, 'orders'), orderBy('placedAt', 'desc'), fsLimit(200)),
  )
  return snap.docs.map((d) => ({ id: d.id, ...toPlain(d) }))
}

export async function updateOrderStatus(orderId, status) {
  const { db } = getFirebase()
  await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: serverTimestamp() })
  return { id: orderId, status }
}

/* ----------------------------------------------------------------- reviews  */
export async function listReviews(restaurantId) {
  const { db } = getFirebase()
  const snap = await getDocs(
    query(
      collection(db, 'restaurants', restaurantId, 'reviews'),
      orderBy('createdAt', 'desc'),
      fsLimit(50),
    ),
  )
  return snap.docs.map((d) => ({ id: d.id, ...toPlain(d) }))
}

export async function addReview(restaurantId, review) {
  const { db } = getFirebase()
  const { restaurantId: _skip, ...payload } = review
  // ek user ka ek restaurant me ek hi review (rules bhi yahi allow karti hain)
  await setDoc(doc(db, 'restaurants', restaurantId, 'reviews', review.userId), {
    ...payload,
    createdAt: serverTimestamp(),
  })

  // denormalised rating refresh
  const all = await listReviews(restaurantId)
  if (all.length) {
    const avg = all.reduce((sum, r) => sum + Number(r.rating || 0), 0) / all.length
    await updateDoc(doc(db, 'restaurants', restaurantId), {
      rating: Math.round(avg * 10) / 10,
      ratingCount: all.length,
    })
  }

  return { ...payload, id: review.userId }
}
