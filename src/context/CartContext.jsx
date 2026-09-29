/* =============================================================================
   CartContext — cart state, localStorage me saved (per user)
   Rules: ek order me sirf ek restaurant ka food (Zomato jaisa)
   ========================================================================== */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { calculateCartTotals } from '../utils/format'

const CartContext = createContext(null)

const storageKey = (userId) => `foodiezone.cart.${userId || 'guest'}`

function loadCart(userId) {
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    const items = raw ? JSON.parse(raw) : []
    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

export function CartProvider ({ children }) {
  const { user } = useAuth()
  const userId = user?.uid || 'guest'
  // user switch hote hi cart badal do — render ke dauraan adjust (effect me setState nahi)
  const [state, setState] = useState(() => ({ userId, items: loadCart(userId) }))
  if (state.userId !== userId) {
    setState({ userId, items: loadCart(userId) })
  }
  const items = state.items
  const [notice, setNotice] = useState(null) // { type, message } — page par dikhta hai

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(userId), JSON.stringify(items))
    } catch (err) {
      console.warn('FoodieZone: cart save failed', err)
    }
  }, [items, userId])

  const addItem = useCallback((dish, qty = 1) => {
    let accepted = true
    setState((current) => {
      const list = current.items
      // cart me ek hi restaurant ka food — compare by id, fallback by name
      const sameRestaurant = (a, b) =>
        (a.restaurantId && b.restaurantId ? a.restaurantId === b.restaurantId : a.restaurantName === b.restaurantName)
      if (list.length && !sameRestaurant(list[0], dish)) {
        accepted = false
        return current
      }
      const existing = list.find((item) => item.id === dish.id)
      if (existing) {
        return {
          ...current,
          items: list.map((item) =>
            item.id === dish.id ? { ...item, qty: Math.min(item.qty + qty, 20) } : item,
          ),
        }
      }
      return {
        ...current,
        items: [
          ...list,
          {
            id: dish.id,
            restaurantId: dish.restaurantId,
            restaurantName: dish.restaurantName,
            name: dish.name,
            price: Number(dish.price) || 0,
            image: dish.image || '',
            veg: Boolean(dish.veg),
            qty,
          },
        ],
      }
    })
    return accepted
  }, [])

  const updateQty = useCallback((id, qty) => {
    setState((current) => ({
      ...current,
      items:
        qty <= 0
          ? current.items.filter((item) => item.id !== id)
          : current.items.map((item) => (item.id === id ? { ...item, qty: Math.min(qty, 20) } : item)),
    }))
  }, [])

  const removeItem = useCallback((id) => {
    setState((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== id),
    }))
  }, [])

  const clearCart = useCallback(() => setState((current) => ({ ...current, items: [] })), [])

  const totals = useMemo(() => calculateCartTotals(items), [items])
  const restaurant = useMemo(
    () => (items[0] ? { id: items[0].restaurantId, name: items[0].restaurantName } : null),
    [items],
  )

  const value = useMemo(
    () => ({
      items,
      count: totals.itemCount,
      totals,
      restaurant,
      notice,
      setNotice,
      addItem,
      updateQty,
      removeItem,
      clearCart,
    }),
    [items, totals, restaurant, notice, addItem, updateQty, removeItem, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart ko CartProvider ke andar use karein')
  return ctx
}
