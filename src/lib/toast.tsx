'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

type ToastItem = {
  id: number
  message: string
  type: ToastType
}

type ToastContextValue = {
  toast: {
    success: (message: string) => void
    error: (message: string) => void
    info: (message: string) => void
  }
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toastStyles: Record<ToastType, {
  icon: typeof CheckCircle
  iconClassName: string
  iconBackgroundClassName: string
  borderClassName: string
}> = {
  success: {
    icon: CheckCircle,
    iconClassName: 'text-green-600',
    iconBackgroundClassName: 'bg-green-50',
    borderClassName: 'border-l-green-500',
  },
  error: {
    icon: AlertCircle,
    iconClassName: 'text-red-600',
    iconBackgroundClassName: 'bg-red-50',
    borderClassName: 'border-l-red-500',
  },
  info: {
    icon: Info,
    iconClassName: 'text-blue-600',
    iconBackgroundClassName: 'bg-blue-50',
    borderClassName: 'border-l-blue-500',
  },
}

let nextToastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = ++nextToastId

    setToasts((current) => [...current, { id, message, type }].slice(-3))
    window.setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  const success = useCallback((message: string) => showToast(message, 'success'), [showToast])
  const error = useCallback((message: string) => showToast(message, 'error'), [showToast])
  const info = useCallback((message: string) => showToast(message, 'info'), [showToast])

  return (
    <ToastContext.Provider value={{ toast: { success, error, info } }}>
      {children}

      <div
        aria-live="polite"
        aria-relevant="additions removals"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-full sm:max-w-sm"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {toasts.map((item) => {
            const style = toastStyles[item.type]
            const Icon = style.icon

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                role={item.type === 'error' ? 'alert' : 'status'}
                className={`pointer-events-auto flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 border-l-4 bg-white px-4 py-3 shadow-lg ${style.borderClassName}`}
              >
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${style.iconBackgroundClassName}`}>
                  <Icon aria-hidden="true" className={`size-5 ${style.iconClassName}`} />
                </span>
                <p className="min-w-0 flex-1 text-sm font-medium leading-5 text-slate-800">
                  {item.message}
                </p>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  aria-label="Close notification"
                  className="-mr-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}
