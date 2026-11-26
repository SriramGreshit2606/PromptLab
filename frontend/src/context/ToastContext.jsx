import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => setToasts((all) => all.filter((t) => t.id !== id)), [])

  const push = useCallback(
    (message, tone = 'success') => {
      const id = Date.now() + Math.random()
      setToasts((all) => [...all, { id, message, tone }])
      setTimeout(() => dismiss(id), 4500)
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({ success: (m) => push(m, 'success'), error: (m) => push(m, 'error') }),
    [push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-card px-4 py-3 text-sm shadow-xl shadow-black/30"
          >
            {toast.tone === 'success'
              ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-good" />
              : <AlertCircle size={18} className="mt-0.5 shrink-0 text-bad" />}
            <p className="flex-1 text-fg">{toast.message}</p>
            <button onClick={() => dismiss(toast.id)} aria-label="Dismiss" className="text-muted hover:text-fg">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <ToastProvider>')
  return context
}
