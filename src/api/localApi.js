/* =============================================================================
   LOCAL adapter — Firebase config na hone par app pure browser me chalta hai
   (localStorage + seed data). Isi interface ko Firebase adapter implement karta
   hai, isliye UI code ko pata hi nahi chalta kaunsa backend chal raha hai.
   ========================================================================== */

import { seedRestaurants, seedReviews } from '../data/seed'
import { makeId } from '../utils/id'
import { filterRestaurants } from '../utils/filters'

const DB_KEY = 'foodiezone.db.v1'
const AUTH_KEY = 'foodiezone.auth.v1'

/* ------------------------------------------------------------------ helpers */
function readDb() {
  try {
    const raw = window.localStorage.getItem(DB_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // corrupt data → fresh seed
  }
  return {
    restaurants: seedRestaurants.map((r) => ({ ...r })),
    reviews: seedReviews.map((r) => ({ ...r })),
    orders: [],
  }
}

function writeDb(db) {
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch (err) {
    // storage full (big images) — demo me data phir bhi memory me kaam karega
    console.warn('FoodieZone: localStorage save failed', err)
  }
  return db
}

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms))
const clone = (value) => JSON.parse(JSON.stringify(value ?? null))
const nowIso = () => new Date().toISOString()

/* ------------------------------------------------------------------ export  */
export const backend = 'local'

/* ------------------------------------------------------------------ auth    */
// Firebase Auth real-time events deta hai — local adapter ko wahi behaviour chahiye,
// isliye listeners ka chhota sa registry rakhte hain.
const authListeners = new Set()

function notifyAuthChange() {
  const current = readAuth()
  authListeners.forEach((listener) => listener(current))
}

function readAuth() {
  try {
    return JSON.parse(window.localStorage.getItem(AUTH_KEY))
  } catch {
    return null
  }
}

function writeAuth(user) {
  if (user) window.localStorage.setItem(AUTH_KEY, JSON.stringify(user))
  else window.localStorage.removeItem(AUTH_KEY)
  notifyAuthChange()
  return user
}

export function onAuthChange(callback) {
  authListeners.add(callback)
  callback(readAuth())
  return () => authListeners.delete(callback)
}

export async function signInWithEmail(email, password) {
  if (!email || !email.includes('@')) throw new Error('Enter a valid email address')
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters')
  const user = {
    uid: makeId('usr'),
    name: email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    email,
    photoURL: '',
    isDemo: true,
  }
  await delay(200)
  return writeAuth(user)
}

export const signUpWithEmail = signInWithEmail

export async function signInWithGoogle() {
  const email = `guest${Math.floor(Math.random() * 9000 + 1000)}@foodiezone.app`
  return signInWithEmail(email, 'demo-password')
}

export async function signOutUser() {
  await delay(100)
  writeAuth(null)
}

/* ------------------------------------------------------------------ profile */
export async function getProfile(userId) {
  const db = readDb()
  const profiles = db.profiles || {}
  return clone(profiles[userId] || null)
}

export async function saveProfile(userId, data) {
  const db = readDb()
  db.profiles = db.profiles || {}
  db.profiles[userId] = { ...db.profiles[userId], ...data, updatedAt: nowIso() }
  writeDb(db)
  return clone(db.profiles[userId])
}

/* ------------------------------------------------------------- restaurants  */
export async function listRestaurants(filters = {}) {
  await delay()
  return filterRestaurants(readDb().restaurants, filters)
}

export async function getRestaurant(id) {
  const found = readDb().restaurants.find((r) => r.id === id)
  if (!found) throw new Error('Restaurant not found')
  return clone(found)
}

export async function getMenuItems(restaurantId) {
  const found = readDb().restaurants.find((r) => r.id === restaurantId)
  return clone(found?.items || [])
}

export async function createRestaurant(data) {
  const db = readDb()
  const id = data.id || makeId('rst')
  const record = { ...data, id, items: data.items || [], menuCategories: data.menuCategories || [] }
  db.restaurants.push(record)
  writeDb(db)
  return clone(record)
}

export async function updateRestaurant(id, data) {
  const db = readDb()
  const index = db.restaurants.findIndex((r) => r.id === id)
  if (index === -1) throw new Error('Restaurant not found')
  db.restaurants[index] = { ...db.restaurants[index], ...data, id, updatedAt: nowIso() }
  writeDb(db)
  return clone(db.restaurants[index])
}

export async function deleteRestaurant(id) {
  const db = readDb()
  db.restaurants = db.restaurants.filter((r) => r.id !== id)
  db.reviews = db.reviews.filter((r) => r.restaurantId !== id)
  writeDb(db)
}

export async function createMenuItem(restaurantId, data) {
  const db = readDb()
  const restaurant = db.restaurants.find((r) => r.id === restaurantId)
  if (!restaurant) throw new Error('Restaurant not found')
  const item = { ...data, id: data.id || makeId('itm') }
  restaurant.items = restaurant.items || []
  restaurant.items.push(item)
  writeDb(db)
  return clone(item)
}

export async function updateMenuItem(restaurantId, itemId, data) {
  const db = readDb()
  const restaurant = db.restaurants.find((r) => r.id === restaurantId)
  if (!restaurant) throw new Error('Restaurant not found')
  const index = (restaurant.items || []).findIndex((i) => i.id === itemId)
  if (index === -1) throw new Error('Dish not found')
  restaurant.items[index] = { ...restaurant.items[index], ...data, id: itemId }
  writeDb(db)
  return clone(restaurant.items[index])
}

export async function deleteMenuItem(restaurantId, itemId) {
  const db = readDb()
  const restaurant = db.restaurants.find((r) => r.id === restaurantId)
  if (!restaurant) return
  restaurant.items = (restaurant.items || []).filter((i) => i.id !== itemId)
  writeDb(db)
}

/** Seed data ko (re)apply karo — admin me "Reset demo data" button */
export async function seedDatabase() {
  const db = readDb()
  db.restaurants = seedRestaurants.map((r) => ({ ...r }))
  db.reviews = seedReviews.map((r) => ({ ...r }))
  writeDb(db)
  return db.restaurants.length
}

/* ------------------------------------------------------------------ orders  */
export async function createOrder(order) {
  const db = readDb()
  const record = {
    ...order,
    id: makeId('ord'),
    placedAt: nowIso(),
    status: 'placed',
  }
  db.orders.unshift(record)
  writeDb(db)
  return clone(record)
}

export async function listMyOrders(userId) {
  return readDb()
    .orders.filter((o) => o.userId === userId)
    .map(clone)
}

export async function listAllOrders() {
  return readDb().orders.map(clone)
}

export async function updateOrderStatus(orderId, status) {
  const db = readDb()
  const order = db.orders.find((o) => o.id === orderId)
  if (!order) throw new Error('Order not found')
  order.status = status
  order.updatedAt = nowIso()
  writeDb(db)
  return clone(order)
}

/* ------------------------------------------------------------------ reviews */
export async function listReviews(restaurantId) {
  return readDb()
    .reviews.filter((r) => r.restaurantId === restaurantId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(clone)
}

export async function addReview(restaurantId, review) {
  const db = readDb()
  const record = {
    ...review,
    id: makeId('rvw'),
    restaurantId,
    createdAt: nowIso(),
  }
  db.reviews.unshift(record)

  // rating aggregate update (list page fast rahe isliye denormalised)
  const restaurant = db.restaurants.find((r) => r.id === restaurantId)
  if (restaurant) {
    const all = db.reviews.filter((r) => r.restaurantId === restaurantId)
    const avg = all.reduce((sum, r) => sum + r.rating, 0) / all.length
    restaurant.rating = Math.round(avg * 10) / 10
    restaurant.ratingCount = all.length
  }

  writeDb(db)
  return clone(record)
}
