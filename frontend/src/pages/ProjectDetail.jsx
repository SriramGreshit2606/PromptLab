import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Database, FileText, FlaskConical, Pencil, Trash2 } from 'lucide-react'
import { datasetsApi, projectsApi, promptsApi, testRunsApi } from '../services/endpoints'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { getErrorMessage } from '../utils/errors'
import { formatDate, formatMs, formatNumber, formatScore } from '../utils/format'
import ProjectFormModal from '../components/ProjectFormModal'
import { Button, Card, ConfirmDialog, EmptyState, ErrorBanner, PageHeader, PageLoader, StatCard, StatusBadge } from '../components/ui'

export default function ProjectDetail() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const { data, loading, error, reload } = useAsync(async () => {
    const [project, prompts, datasets, allRuns] = await Promise.all([
      projectsApi.get(projectId), promptsApi.list(projectId), datasetsApi.list(projectId), testRunsApi.list(),
    ])
    // The runs endpoint is not filterable by project, so filter by this project's prompts.
    const promptIds = new Set(prompts.map((p) => p.id))
    return { project, prompts, datasets, runs: allRuns.filter((run) => promptIds.has(run.prompt_id)) }
  }, [projectId])

  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function confirmDelete() {
    setDeleteBusy(true)
    setDeleteError('')
    try {
      await projectsApi.remove(projectId)
      toast.success('Project deleted.')
      navigate('/projects', { replace: true })
    } catch (err) {
      setDeleteError(getErrorMessage(err))
      setDeleteBusy(false)
    }
  }

  const back = (
    <Link to="/projects" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
      <ArrowLeft size={16} /> All projects
    </Link>
  )

  if (loading) return <PageLoader />
  if (error) {
    return (
      <>
        {back}
        <ErrorBanner message={error} onRetry={reload} />
      </>
    )
  }

  const { project, prompts, datasets, runs } = data

  return (
    <>
      <PageHeader
        back={back}
        title={project.name}
        description={project.description || 'No description.'}
        actions={(
          <>
            <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="danger" icon={Trash2} onClick={() => setConfirmingDelete(true)}>Delete</Button>
          </>
        )}
      />
      <p className="-mt-3 mb-6 text-xs text-muted">Created {formatDate(project.created_at)} · Updated {formatDate(project.updated_at)}</p>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Prompts" value={formatNumber(prompts.length)} icon={FileText} />
        <StatCard label="Datasets" value={formatNumber(datasets.length)} icon={Database} />
        <StatCard label="Test runs" value={formatNumber(runs.length)} icon={FlaskConical} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Prompts</h2>
          {prompts.length === 0 ? (
            <EmptyState icon={FileText} title="No prompts yet" description="Prompts you create in this project will be listed here." />
          ) : (
            <ul className="divide-y divide-line">
              {prompts.map((prompt) => (
                <li key={prompt.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link to={`/prompts/${prompt.id}`} className="block truncate font-medium hover:text-accent">{prompt.name}</Link>
                    {prompt.description && <p className="truncate text-xs text-muted">{prompt.description}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-muted">{formatDate(prompt.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Datasets</h2>
          {datasets.length === 0 ? (
            <EmptyState icon={Database} title="No datasets yet" description="Test datasets for this project will be listed here." />
          ) : (
            <ul className="divide-y divide-line">
              {datasets.map((dataset) => (
                <li key={dataset.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link to={`/datasets/${dataset.id}`} className="block truncate font-medium hover:text-accent">{dataset.name}</Link>
                    {dataset.description && <p className="truncate text-xs text-muted">{dataset.description}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-muted">{formatDate(dataset.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <h2 className="mb-4 font-semibold">Test runs</h2>
        {runs.length === 0 ? (
          <EmptyState icon={FlaskConical} title="No test runs yet" description="Runs of this project’s prompts will show up here with their scores." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="pb-2 font-normal">Run</th>
                  <th className="pb-2 font-normal">Prompt</th>
                  <th className="pb-2 font-normal">Status</th>
                  <th className="pb-2 text-right font-normal">Cases</th>
                  <th className="pb-2 text-right font-normal">Score</th>
                  <th className="pb-2 text-right font-normal">Tokens</th>
                  <th className="pb-2 text-right font-normal">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {runs.map((run) => (
                  <tr key={run.id}>
                    <td className="py-3"><Link to={`/runs/${run.id}`} className="text-accent hover:underline">#{run.id}</Link></td>
                    <td className="max-w-[10rem] truncate py-3 font-medium">{prompts.find((p) => p.id === run.prompt_id)?.name}</td>
                    <td className="py-3"><StatusBadge status={run.status} /></td>
                    <td className="py-3 text-right">{run.completed_cases}/{run.total_cases}</td>
                    <td className="py-3 text-right">{run.status === 'completed' ? formatScore(run.average_score) : '—'}</td>
                    <td className="py-3 text-right">{formatNumber(run.total_tokens)}</td>
                    <td className="py-3 text-right">{formatMs(run.total_latency_ms)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ProjectFormModal
        open={editing}
        project={project}
        onClose={() => setEditing(false)}
        onSaved={() => { setEditing(false); toast.success('Project updated.'); reload() }}
      />

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete project?"
        message={`“${project.name}” and everything inside it (prompts, versions, datasets and test runs) will be permanently deleted. This cannot be undone.`}
        loading={deleteBusy}
        error={deleteError}
        onConfirm={confirmDelete}
        onClose={() => setConfirmingDelete(false)}
      />
    </>
  )
}
