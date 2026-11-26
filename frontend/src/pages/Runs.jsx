import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FlaskConical, GitCompare, Play } from 'lucide-react'
import { useRunData } from '../hooks/useRunData'
import { formatMs, formatNumber, formatScore } from '../utils/format'
import { Card, EmptyState, ErrorBanner, LinkButton, PageHeader, PageLoader, Select, StatusBadge } from '../components/ui'

export default function Runs() {
  const { data, loading, error, reload } = useRunData()
  const [status, setStatus] = useState('')
  const [promptId, setPromptId] = useState('')

  if (loading && !data) return <PageLoader />
  if (error) return <ErrorBanner message={error} onRetry={reload} />

  const { runs, prompts, promptName, datasetName, versionNo } = data
  const visible = runs.filter((r) => (!status || r.status === status) && (!promptId || String(r.prompt_id) === promptId))

  return (
    <>
      <PageHeader
        title="Results"
        description="Every test run, newest first."
        actions={(
          <>
            {runs.length >= 2 && <LinkButton to="/comparison" variant="secondary" icon={GitCompare}>Compare runs</LinkButton>}
            <LinkButton to="/playground" icon={Play}>New test run</LinkButton>
          </>
        )}
      />

      {runs.length === 0 ? (
        <EmptyState icon={FlaskConical} title="No test runs yet" description="Run a prompt version against a dataset to see scores, tokens and latency here." action={<LinkButton to="/playground" icon={Play}>Open playground</LinkButton>} />
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row">
            <Select value={promptId} onChange={(e) => setPromptId(e.target.value)} className="sm:w-56" aria-label="Filter by prompt">
              <option value="">All prompts</option>
              {prompts.filter((p) => runs.some((r) => r.prompt_id === p.id)).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-44" aria-label="Filter by status">
              <option value="">All statuses</option>
              {['completed', 'running', 'failed', 'pending'].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </Select>
          </div>

          {visible.length === 0 ? <EmptyState title="No matching runs" description="Change the filters to see more runs." /> : (
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[50rem] text-left text-sm">
                <thead className="border-b border-line text-xs text-muted">
                  <tr>
                    <th className="px-5 py-3 font-normal">Run</th>
                    <th className="px-3 py-3 font-normal">Prompt</th>
                    <th className="px-3 py-3 font-normal">Dataset</th>
                    <th className="px-3 py-3 font-normal">Status</th>
                    <th className="px-3 py-3 text-right font-normal">Cases</th>
                    <th className="px-3 py-3 text-right font-normal">Score</th>
                    <th className="px-3 py-3 text-right font-normal">Tokens</th>
                    <th className="px-5 py-3 text-right font-normal">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visible.map((run) => (
                    <tr key={run.id} className="hover:bg-raised/40">
                      <td className="px-5 py-3.5"><Link to={`/runs/${run.id}`} className="font-medium text-accent hover:underline">#{run.id}</Link></td>
                      <td className="max-w-[12rem] truncate px-3 py-3.5">{promptName[run.prompt_id] || `Prompt ${run.prompt_id}`} <span className="text-muted">v{versionNo[run.prompt_version_id] ?? '?'}</span></td>
                      <td className="max-w-[10rem] truncate px-3 py-3.5 text-muted">{datasetName[run.dataset_id] || `Dataset ${run.dataset_id}`}</td>
                      <td className="px-3 py-3.5"><StatusBadge status={run.status} /></td>
                      <td className="px-3 py-3.5 text-right text-muted">{run.completed_cases}/{run.total_cases}</td>
                      <td className="px-3 py-3.5 text-right font-medium">{run.status === 'completed' ? formatScore(run.average_score) : '—'}</td>
                      <td className="px-3 py-3.5 text-right text-muted">{formatNumber(run.total_tokens)}</td>
                      <td className="px-5 py-3.5 text-right text-muted">{formatMs(run.total_latency_ms)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </>
  )
}
