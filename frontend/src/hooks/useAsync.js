import { useCallback, useEffect, useRef, useState } from 'react'
import { getErrorMessage } from '../utils/errors'

// Runs an async loader on mount (and whenever `deps` change) and exposes loading / error / reload.
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const latestCall = useRef(0)

  const run = useCallback(async () => {
    const callId = ++latestCall.current
    setState((previous) => ({ ...previous, loading: true, error: null }))
    try {
      const data = await loader()
      if (callId === latestCall.current) setState({ data, error: null, loading: false })
    } catch (error) {
      if (callId === latestCall.current) {
        setState({ data: null, error: getErrorMessage(error), loading: false })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    run()
    return () => { latestCall.current += 1 }
  }, [run])

  return { ...state, reload: run }
}
