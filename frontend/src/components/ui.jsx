import { forwardRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Loader2, X } from 'lucide-react'

export const cx = (...parts) => parts.filter(Boolean).join(' ')

/* ---------- Buttons ---------- */

const VARIANTS = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-hover',
  secondary: 'border border-line bg-card text-fg hover:border-accent/50 hover:bg-raised',
  ghost: 'text-muted hover:bg-raised hover:text-fg',
  danger: 'border border-bad/40 bg-bad/10 text-bad hover:bg-bad/20',
}
const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
}

export function buttonClasses(variant = 'primary', size = 'md', extra = '') {
  return cx(
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
    'disabled:cursor-not-allowed disabled:opacity-55',
    VARIANTS[variant],
    SIZES[size],
    extra,
  )
}

export function Button({ variant = 'primary', size = 'md', loading = false, icon: Icon, children, className, disabled, type = 'button', ...props }) {
  return (
    <button type={type} disabled={disabled || loading} className={buttonClasses(variant, size, className)} {...props}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  )
}

export function LinkButton({ to, variant = 'primary', size = 'md', icon: Icon, children, className, ...props }) {
  return (
    <Link to={to} className={buttonClasses(variant, size, className)} {...props}>
      {Icon ? <Icon size={16} /> : null}
      {children}
    </Link>
  )
}

export function IconButton({ label, children, className, tone = 'default', ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
        tone === 'danger' ? 'hover:bg-bad/10 hover:text-bad' : 'hover:bg-raised hover:text-fg',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/* ---------- Form controls ---------- */

export function Field({ label, htmlFor, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={htmlFor} className="block text-sm font-medium text-fg">{label}</label>}
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p role="alert" className="text-xs text-bad">{error}</p>}
    </div>
  )
}

export const Input = forwardRef(function Input({ className, invalid, ...props }, ref) {
  return <input ref={ref} aria-invalid={invalid || undefined} className={cx('input-base', invalid && 'border-bad focus:border-bad focus:ring-bad/25', className)} {...props} />
})

export const Textarea = forwardRef(function Textarea({ className, invalid, ...props }, ref) {
  return <textarea ref={ref} aria-invalid={invalid || undefined} className={cx('input-base min-h-[96px] resize-y', invalid && 'border-bad focus:border-bad focus:ring-bad/25', className)} {...props} />
})

export function Select({ className, children, ...props }) {
  return <select className={cx('input-base appearance-none pr-8', className)} {...props}>{children}</select>
}

export const PasswordInput = forwardRef(function PasswordInput({ invalid, ...props }, ref) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input ref={ref} type={visible ? 'text' : 'password'} invalid={invalid} className="pr-11" {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-fg"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
})

/* ---------- Surfaces ---------- */

export function Card({ className, children, ...props }) {
  return <div className={cx('rounded-2xl border border-line bg-card', className)} {...props}>{children}</div>
}

export function PageHeader({ title, description, actions, back }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {back}
        <h1 className="truncate text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function StatCard({ label, value, icon: Icon, hint }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        {Icon && <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent"><Icon size={18} /></span>}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  )
}

const BADGE_TONES = {
  neutral: 'border-line bg-raised text-muted',
  accent: 'border-accent/30 bg-accent-soft text-accent',
  good: 'border-good/30 bg-good/10 text-good',
  warn: 'border-warn/30 bg-warn/10 text-warn',
  bad: 'border-bad/30 bg-bad/10 text-bad',
}

export function Badge({ tone = 'neutral', children, className }) {
  return <span className={cx('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', BADGE_TONES[tone], className)}>{children}</span>
}

const STATUS_TONES = { completed: 'good', failed: 'bad', running: 'accent', pending: 'neutral' }
export function StatusBadge({ status }) {
  return <Badge tone={STATUS_TONES[status] || 'neutral'} className="capitalize">{status}</Badge>
}

/* ---------- Feedback states ---------- */

export function Spinner({ className }) {
  return <Loader2 className={cx('animate-spin text-accent', className)} size={20} />
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-3 text-sm text-muted" role="status">
      <Spinner /> {label}
    </div>
  )
}

export function ErrorBanner({ message, onRetry, className }) {
  if (!message) return null
  return (
    <div role="alert" className={cx('flex items-start gap-3 rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-sm', className)}>
      <AlertCircle size={18} className="mt-0.5 shrink-0 text-bad" />
      <p className="flex-1 text-fg">{message}</p>
      {onRetry && <button onClick={onRetry} className="font-semibold text-bad underline-offset-2 hover:underline">Retry</button>}
    </div>
  )
}

export function NoticeBanner({ message, className }) {
  if (!message) return null
  return (
    <div role="status" className={cx('flex items-start gap-3 rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm', className)}>
      <AlertCircle size={18} className="mt-0.5 shrink-0 text-warn" />
      <p className="flex-1 text-fg">{message}</p>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cx('flex flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-12 text-center', className)}>
      {Icon && <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent"><Icon size={22} /></span>}
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ---------- Dialogs ---------- */

export function Modal({ open, title, onClose, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const width = size === 'lg' ? 'max-w-2xl' : 'max-w-lg'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-4 backdrop-blur-sm sm:items-center" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div role="dialog" aria-modal="true" aria-label={title} className={cx('w-full rounded-2xl border border-line bg-card shadow-2xl shadow-black/50', width)}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <IconButton label="Close" onClick={onClose}><X size={18} /></IconButton>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', loading, error, onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={loading ? () => {} : onClose}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      )}
    >
      <p className="text-sm text-muted">{message}</p>
      <ErrorBanner message={error} className="mt-4" />
    </Modal>
  )
}
