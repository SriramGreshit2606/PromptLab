import { useState } from 'react'
import { GitCompare, Trophy } from 'lucide-react'
import { comparisonsApi, testRunsApi } from '../services/endpoints'
import { useRunData } from '../hooks/useRunData'
import { getErrorMessage } from '../utils/errors'
import { formatMs, formatNumber, formatScore } from '../utils/format'
import ScoreBar from '../components/ScoreBar'
import { Badge, Button, Card, EmptyState, ErrorBanner, Field, LinkButton, NoticeBanner, PageHeader, PageLoader, Select, cx } from '../components/ui'

function Metric({ label, a, b, format, lowerIsBetter }) {
  const max = Math.max(a, b, 1)
  const better = a === b ? null : (a < b) === lowerIsBetter ? 'a' : 'b'
  const row = (key, value) => (
    <div className="flex items-center gap-3">
      <span className="w-6 text-xs text-muted">{key === 'a' ? 'A' : 'B'}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-raised">
        <div className={cx('h-full rounded-full', better === key ? 'bg-good' : 'bg-muted/50')} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className={cx('w-24 text-right text-sm', better === key && 'font-semibold text-good')}>{format(value)}</span>
    </div>
  )
  return (
    <Card className="space-y-2.5 p-5">
      <p className="text-sm text-muted">{label}</p>
      {row('a', a)}
      {row('b', b)}
    </Card>
  )
}

function Response({ result, better }) {
  if (!result) return <p className="rounded-xl border border-dashed border-line p-3 text-sm text-muted">No result for this case in this run.</p>
  return (
    <div className={cx('rounded-xl border p-3', better ? 'border-good/50 bg-good/5' : 'border-line bg-bg/60')}>
      <ScoreBar value={result.score} />
      <p className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-sm">{result.ai_response || '—'}</p>
      <p className="mt-2 text-xs text-muted">{formatNumber(result.total_tokens)} tokens · {formatMs(result.latency_ms)}</p>
    </div>
  )
}

export default function Comparison() {
  const { data, loading, error, reload } = useRunData()
  const [promptId, setPromptId] = useState('')
  const [firstId, setFirstId] = useState('')
  const [secondId, setSecondId] = useState('')
  const [comparing, setComparing] = useState(false)
  const [compareError, setCompareError] = useState('')
  const [outcome, setOutcome] = useState(null)
  const [onlyDifferent, setOnlyDifferent] = useState(false)

  if (loading && !data) return <PageLoader />
  if (error) return <ErrorBanner message={error} onRetry={reload} />

  const { runs, prompts, promptName, datasetName, versionNo } = data
  const completed = runs.filter((r) => r.status === 'completed')
  const eligiblePrompts = prompts.filter((p) => completed.filter((r) => r.prompt_id === p.id).length >= 2)
  const promptRuns = completed.filter((r) => String(r.prompt_id) === promptId).sort((x, y) => x.id - y.id)
  const runLabel = (r) => `#${r.id} · v${versionNo[r.prompt_version_id] ?? '?'} · ${datasetName[r.dataset_id] || 'dataset'} · ${formatScore(r.average_score)}`

  async function compare() {
    setCompareError('')
    setOutcome(null)
    setComparing(true)
    try {
      const [summary, resultsA, resultsB] = await Promise.all([
        comparisonsApi.compare(firstId, secondId), testRunsApi.results(firstId), testRunsApi.results(secondId),
      ])
      setOutcome({ summary, runA: runs.find((r) => String(r.id) === firstId), runB: runs.find((r) => String(r.id) === secondId), resultsA, resultsB })
    } catch (err) {
      setCompareError(getErrorMessage(err))
    } finally {
      setComparing(false)
    }
  }

  const sameRun = firstId && firstId === secondId

  let table = []
  if (outcome) {
    const byCaseA = new Map(outcome.resultsA.map((r) => [r.dataset_case_id, r]))
    const byCaseB = new Map(outcome.resultsB.map((r) => [r.dataset_case_id, r]))
    const ids = [...new Set([...byCaseA.keys(), ...byCaseB.keys()])]
    table = ids.map((id, i) => ({ id, n: i + 1, a: byCaseA.get(id), b: byCaseB.get(id) }))
    if (onlyDifferent) table = table.filter((row) => !row.a || !row.b || row.a.score !== row.b.score)
  }

  const s = outcome?.summary
  const winner = s ? (s.first_average_score > s.second_average_score ? 'A' : s.second_average_score > s.first_average_score ? 'B' : null) : null
  const signed = (n, fmt) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmt(Math.abs(n))}`

  return (
    <>
      <PageHeader title="Compare runs" description="Pick two completed runs of the same prompt and see which version scored better." />

      {eligiblePrompts.length === 0 ? (
        <EmptyState icon={GitCompare} title="Not enough completed runs" description="Comparison needs at least two completed runs of the same prompt, for example two versions tested on the same dataset." action={<LinkButton to="/playground">Run a test</LinkButton>} />
      ) : (
        <Card className="p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Prompt" htmlFor="cmp-prompt">
              <Select id="cmp-prompt" value={promptId} onChange={(e) => { setPromptId(e.target.value); setFirstId(''); setSecondId(''); setOutcome(null) }}>
                <option value="">Choose a prompt</option>
                {eligiblePrompts.map((p) => <option key={p.id} value={p.id}>{promptName[p.id]}</option>)}
              </Select>
            </Field>
            <Field label="Run A" htmlFor="cmp-a">
              <Select id="cmp-a" value={firstId} onChange={(e) => setFirstId(e.target.value)} disabled={!promptId}>
                <option value="">Choose a run</option>
                {promptRuns.map((r) => <option key={r.id} value={r.id}>{runLabel(r)}</option>)}
              </Select>
            </Field>
            <Field label="Run B" htmlFor="cmp-b" error={sameRun ? 'Choose two different runs.' : ''}>
              <Select id="cmp-b" value={secondId} onChange={(e) => setSecondId(e.target.value)} disabled={!promptId}>
                <option value="">Choose a run</option>
                {promptRuns.map((r) => <option key={r.id} value={r.id}>{runLabel(r)}</option>)}
              </Select>
            </Field>
          </div>
          <div className="mt-5"><Button icon={GitCompare} onClick={compare} loading={comparing} disabled={!firstId || !secondId || sameRun}>Compare</Button></div>
        </Card>
      )}

      <ErrorBanner message={compareError} className="mt-4" />

      {outcome && (
        <div className="mt-6 space-y-6">
          <Card className={cx('flex flex-wrap items-center gap-4 p-5', winner && 'border-good/40')}>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-good/10 text-good"><Trophy size={22} /></span>
            <div className="min-w-0 flex-1">
              {winner ? (
                <>
                  <p className="text-lg font-semibold">Run {winner} (v{versionNo[(winner === 'A' ? s.first_prompt_version_id : s.second_prompt_version_id)] ?? '?'}) scored higher</p>
                  <p className="text-sm text-muted">Average {formatScore(Math.max(s.first_average_score, s.second_average_score))} vs {formatScore(Math.min(s.first_average_score, s.second_average_score))}, a difference of {formatScore(Math.abs(s.score_difference))}.</p>
                </>
              ) : (
                <><p className="text-lg font-semibold">Both runs scored the same</p><p className="text-sm text-muted">Average {formatScore(s.first_average_score)} each.</p></>
              )}
            </div>
            <div className="text-xs text-muted">B vs A: {signed(s.token_difference, formatNumber)} tokens · {signed(s.latency_difference_ms, formatMs)} latency</div>
          </Card>

          {outcome.runA?.dataset_id !== outcome.runB?.dataset_id && <NoticeBanner message="These runs used different datasets, so only cases that appear in both can be compared fairly." />}

          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="Average score" a={s.first_average_score} b={s.second_average_score} format={formatScore} />
            <Metric label="Total tokens (lower is better)" a={s.first_total_tokens} b={s.second_total_tokens} format={formatNumber} lowerIsBetter />
            <Metric label="Total latency (lower is better)" a={s.first_total_latency_ms} b={s.second_total_latency_ms} format={formatMs} lowerIsBetter />
          </div>

          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Case by case</h2>
              <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" checked={onlyDifferent} onChange={(e) => setOnlyDifferent(e.target.checked)} className="accent-[#A995FF]" /> Only cases where scores differ</label>
            </div>
            {table.length === 0 ? <EmptyState title="No differences" description="Every shared case scored the same in both runs." /> : (
              <div className="space-y-4">
                {table.map((row) => {
                  const diff = row.a && row.b ? row.b.score - row.a.score : null
                  return (
                    <Card key={row.id} className="p-5">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold">Case {row.n}</h3>
                        {diff !== null && diff !== 0 && <Badge tone={diff > 0 ? 'good' : 'bad'}>B {diff > 0 ? '+' : '−'}{Math.abs(diff).toFixed(1)} pts vs A</Badge>}
                      </div>
                      <div className="mb-4 grid gap-4 md:grid-cols-2">
                        <div><p className="mb-1 text-xs uppercase tracking-wide text-muted">Input</p><p className="max-h-32 overflow-auto whitespace-pre-wrap text-sm">{(row.a || row.b).input_text}</p></div>
                        <div><p className="mb-1 text-xs uppercase tracking-wide text-muted">Expected answer</p><p className="max-h-32 overflow-auto whitespace-pre-wrap text-sm text-muted">{(row.a || row.b).expected_output}</p></div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div><p className="mb-1.5 text-xs font-medium text-muted">Run A</p><Response result={row.a} better={diff !== null && diff < 0} /></div>
                        <div><p className="mb-1.5 text-xs font-medium text-muted">Run B</p><Response result={row.b} better={diff !== null && diff > 0} /></div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
