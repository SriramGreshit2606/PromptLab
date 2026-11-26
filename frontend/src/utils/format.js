export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(date)
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value) || 0)
}

export function formatMs(value) {
  const ms = Number(value) || 0
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`
}

// Backend scores are 0-100 similarity percentages.
export function formatScore(value) {
  const n = Number(value)
  return Number.isFinite(n) ? `${n.toFixed(1)}%` : '—'
}

// Display-only colour bands. The backend does not define pass/fail.
export function scoreTone(value) {
  const n = Number(value) || 0
  if (n >= 70) return 'good'
  if (n >= 40) return 'warn'
  return 'bad'
}
