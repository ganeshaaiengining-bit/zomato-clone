import { useEffect, useState } from 'react'

/** Search box ke typing ko throttle — har keystroke pe API call na chale */
export function useDebounce (value, delay = 350) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
