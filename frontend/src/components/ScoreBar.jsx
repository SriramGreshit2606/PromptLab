import { formatScore, scoreTone } from '../utils/format'

const BAR = { good: 'bg-good', warn: 'bg-warn', bad: 'bg-bad' }
const TEXT = { good: 'text-good', warn: 'text-warn', bad: 'text-bad' }

// Similarity score (0-100) with a coloured bar. Colour bands are display-only.
export default function ScoreBar({ value }) {
  const tone = scoreTone(value)
  const width = Math.min(Math.max(Number(value) || 0, 0), 100)
  return (
    <div className="flex min-w-[7rem] items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-raised"><div className={`h-full rounded-full ${BAR[tone]}`} style={{ width: `${width}%` }} /></div>
      <span className={`w-14 text-right text-sm font-semibold ${TEXT[tone]}`}>{formatScore(value)}</span>
    </div>
  )
}
