
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, Coins, Gauge, GitCompare, ListChecks } from 'lucide-react'
import { datasetsApi, promptsApi, testRunsApi, versionsApi } from '../services/endpoints'
import { useAsync } from '../hooks/useAsync'
import ScoreBar from '../components/ScoreBar'
import { formatMs, formatNumber, formatScore } from '../utils/format'
import { Card, EmptyState, ErrorBanner, LinkButton, NoticeBanner, PageHeader, PageLoader, Select, StatCard, StatusBadge } from '../components/ui'

function TextBlock({ title, children, tone }) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
      <div className={`max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-line p-3 text-sm ${tone || 'bg-bg/60'}`}>
        {children || '—'}
      </div>
    </div>
  )
}

const criteria = [
  { key: 'correctness', label: 'Correctness', weight: '35%' },
  { key: 'relevance', label: 'Relevance', weight: '25%' },
  { key: 'completeness', label: 'Completeness', weight: '20%' },
  { key: 'clarity', label: 'Clarity', weight: '10%' },
  { key: 'instruction_following', label: 'Instruction Following', weight: '10%' },
]

function JudgeEvaluation({ result }) {
  const hasBreakdown = criteria.some(
    ({ key }) => result[key] !== null && result[key] !== undefined
  )

  return (
    <div className="mt-5 rounded-xl border border-line bg-bg/40 p-4">
      <div className="mb-4">
        <h4 className="font-semibold">AI Judge Evaluation</h4>
        <p className="mt-1 text-xs text-muted">
          Evaluation based on five weighted criteria
        </p>
      </div>

      {!hasBreakdown ? (
        <p className="text-sm text-muted">
          No criterion breakdown available for this result.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {criteria.map(({ key, label, weight }) => {
            const score = Number(result[key])
            const validScore = Number.isFinite(score)
              ? Math.min(100, Math.max(0, score))
              : 0

            return (
              <div key={key}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {validScore.toFixed(1)}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${validScore}%` }}
                  />
                </div>

                <p className="mt-1 text-xs text-muted">
                  Weight: {weight}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {result.evaluation_reason && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Judge Explanation
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {result.evaluation_reason}
          </p>
        </div>
      )}
    </div>
  )
}

export default function RunDetail() {
  const { runId } = useParams()
  const [sort, setSort] = useState('order')

  const { data, loading, error, reload } = useAsync(async () => {
    const [run, results] = await Promise.all([
      testRunsApi.get(runId),
      testRunsApi.results(runId),
    ])

    const [prompt, dataset, versions] = await Promise.all([
      promptsApi.get(run.prompt_id).catch(() => null),
      datasetsApi.get(run.dataset_id).catch(() => null),
      versionsApi.list(run.prompt_id).catch(() => []),
    ])

    return {
      run,
      results,
      prompt,
      dataset,
      version: versions.find((v) => v.id === run.prompt_version_id),
    }
  }, [runId])

  const status = data?.run.status

  useEffect(() => {
    if (status !== 'running' && status !== 'pending') return undefined

    const timer = setInterval(reload, 3000)
    return () => clearInterval(timer)
  }, [status, reload])

  const back = (
    <Link
      to="/runs"
      className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
    >
      <ArrowLeft size={16} /> All results
    </Link>
  )

  if (loading && !data) return <PageLoader />

  if (error && !data) {
    return (
      <>
        <div>{back}</div>
        <ErrorBanner message={error} onRetry={reload} />
      </>
    )
  }

  const { run, results, prompt, dataset, version } = data

  const tokensIn = results.reduce((sum, r) => sum + r.input_tokens, 0)
  const tokensOut = results.reduce((sum, r) => sum + r.output_tokens, 0)

  const avgLatency = results.length
    ? results.reduce((sum, r) => sum + r.latency_ms, 0) / results.length
    : 0

  const rows = [...results]

  if (sort === 'lowest') rows.sort((a, b) => a.score - b.score)
  if (sort === 'highest') rows.sort((a, b) => b.score - a.score)
  if (sort === 'slowest') rows.sort((a, b) => b.latency_ms - a.latency_ms)

  const caseNumber = Object.fromEntries(
    results.map((r, i) => [r.id, i + 1])
  )

  return (
    <>
      <PageHeader
        back={back}
        title={`Run #${run.id}`}
        description={`${prompt?.name || `Prompt ${run.prompt_id}`}${version ? ` · v${version.version_number}` : ''} · ${dataset?.name || `Dataset ${run.dataset_id}`}`}
        actions={
          <>
            <StatusBadge status={run.status} />
            {run.status === 'completed' && (
              <LinkButton to="/comparison" variant="secondary" icon={GitCompare}>
                Compare
              </LinkButton>
            )}
          </>
        }
      />

      {run.status === 'failed' && (
        <NoticeBanner
          className="mb-4"
          message={`This run failed after ${run.completed_cases} of ${run.total_cases} cases. The results below are partial and the average covers only those cases.`}
        />
      )}

      {(run.status === 'running' || run.status === 'pending') && (
        <NoticeBanner
          className="mb-4"
          message={`In progress: ${run.completed_cases} of ${run.total_cases} cases done. This page refreshes automatically.`}
        />
      )}

      <ErrorBanner message={error} className="mb-4" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Average score"
          value={formatScore(run.average_score)}
          icon={Gauge}
          hint="AI Judge weighted evaluation"
        />

        <StatCard
          label="Cases"
          value={`${run.completed_cases} / ${run.total_cases}`}
          icon={ListChecks}
        />

        <StatCard
          label="Total tokens"
          value={formatNumber(run.total_tokens)}
          icon={Coins}
          hint={`${formatNumber(tokensIn)} in · ${formatNumber(tokensOut)} out`}
        />

        <StatCard
          label="Total latency"
          value={formatMs(run.total_latency_ms)}
          icon={Clock}
          hint={`${formatMs(avgLatency)} per case`}
        />
      </div>

      <div className="mb-4 mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Test case results</h2>

        {results.length > 1 && (
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-48"
            aria-label="Sort results"
          >
            <option value="order">Dataset order</option>
            <option value="lowest">Lowest score first</option>
            <option value="highest">Highest score first</option>
            <option value="slowest">Slowest first</option>
          </Select>
        )}
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No results recorded"
          description="This run has no stored test case results."
        />
      ) : (
        <div className="space-y-4">
          {rows.map((result) => (
            <Card key={result.id} className="p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold">
                  Case {caseNumber[result.id]}
                </h3>

                <div className="w-56">
                  <ScoreBar value={result.score} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <TextBlock title="Input">
                  {result.input_text}
                </TextBlock>

                <TextBlock title="Expected answer">
                  {result.expected_output}
                </TextBlock>

                <TextBlock title="AI response" tone="bg-accent-soft">
                  {result.ai_response}
                </TextBlock>
              </div>

              <JudgeEvaluation result={result} />

              <p className="mt-4 text-xs text-muted">
                {formatNumber(result.input_tokens)} tokens in ·{' '}
                {formatNumber(result.output_tokens)} out ·{' '}
                {formatNumber(result.total_tokens)} total ·{' '}
                {formatMs(result.latency_ms)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
