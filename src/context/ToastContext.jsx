/* =============================================================================
   ToastContext — chhote notifications (add to cart, errors, order placed)
   ========================================================================== */

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const ToastContext = createContext(null)

let nextId = 0

export function ToastProvider ({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((item) => item.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const notify = useCallback(
    (message, type = 'info', duration = 3000) => {
      if (!message) return
      const id = ++nextId
      setToasts((list) => [...list.slice(-2), { id, message, type }])
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration),
      )
      return id
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      toasts,
      notify,
      dismiss,
      success: (msg) => notify(msg, 'success'),
      error: (msg) => notify(msg, 'error', 4000),
    }),
    [toasts, notify, dismiss],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast ko ToastProvider ke andar use karein')
  return ctx
}
