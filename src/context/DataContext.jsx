/* =============================================================================
   DataContext — kaunsa backend chal raha hai (Firebase ya local demo)

   Firebase configure hai lekin service (Firestore/Auth) abhi enabled nahi hui,
   ya network issue hai — tab bhi app jeeḍ rahe: user ek click se demo data par
   switch kar sakta hai (choice localStorage me yaad rehti hai).
   ========================================================================== */

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { initApi, isFirebaseConfigured } from '../api/index'
import * as localApi from '../api/localApi'

const DEMO_KEY = 'foodiezone.useDemo'

const DataContext = createContext(null)

function readDemoPreference() {
  try {
    return window.localStorage.getItem(DEMO_KEY) === '1'
  } catch {
    return false
  }
}

export function DataProvider ({ children }) {
  const [state, setState] = useState({ api: null, ready: false })
  const [demoOverride, setDemoOverride] = useState(readDemoPreference)

  useEffect(() => {
    let cancelled = false
    initApi().then((api) => {
      if (!cancelled) setState({ api, ready: true })
    })
    return () => {
      cancelled = true
    }
  }, [])

  const enableDemoData = () => {
    try {
      window.localStorage.setItem(DEMO_KEY, '1')
    } catch {
      // ignore
    }
    setDemoOverride(true)
  }

  const useFirebaseData = () => {
    try {
      window.localStorage.removeItem(DEMO_KEY)
    } catch {
      // ignore
    }
    setDemoOverride(false)
  }

  const value = useMemo(() => {
    const usingDemo = demoOverride || !isFirebaseConfigured || state.api?.backend === 'local'
    return {
      api: usingDemo ? localApi : state.api,
      ready: state.ready && (usingDemo || Boolean(state.api)),
      isDemo: usingDemo,
      demoOverride,
      enableDemoData,
      useFirebaseData,
    }
  }, [state, demoOverride])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData ko DataProvider ke andar use karein')
  return ctx
}

/** Ready hone ke baad hi use hota hai — pages `if (!api) return <PageLoader />`. */
export function useApi() {
  const { api } = useData()
  if (!api) throw new Error('Data abhi load nahi hua — useData().ready check karein')
  return api
}
