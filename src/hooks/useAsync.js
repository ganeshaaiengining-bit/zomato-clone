import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * useAsync — data fetch + loading/error state, component me hi.
 *
 * `task` ko `useCallback` se memoize karein — tabhi dependency khud trigger hoti hai:
 *   const restaurants = useAsync(
 *     useCallback(() => api.listRestaurants(filters), [api, filters]),
 *     { immediate: ready },
 *   )
 *
 * @param {() => Promise<any>} task          memoized async function
 * @param {{immediate?: boolean, timeoutMs?: number}} options
 *   immediate  = false → jab tak task change na ho, fetch start nahi hoga
 *   timeoutMs  = network hang par error dikhane ka max wait (default 15s)
 */
export function useAsync (task, { immediate = true, timeoutMs = 15000 } = {}) {
  const [state, setState] = useState({ data: null, loading: immediate, error: null })
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const run = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }))

    let timer
    try {
      const data = await Promise.race([
        task(),
        new Promise((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Request timed out — network ya Firebase service check karein')),
            timeoutMs,
          )
        }),
      ])
      if (alive.current) setState({ data, loading: false, error: null })
      return data
    } catch (error) {
      if (alive.current) setState((current) => ({ ...current, loading: false, error }))
      return null
    } finally {
      clearTimeout(timer)
    }
  }, [task, timeoutMs])

  useEffect(() => {
    if (immediate) run()
  }, [immediate, run])

  return {
    ...state,
    reload: run,
    setData: (data) => setState((current) => ({ ...current, data })),
  }
}
