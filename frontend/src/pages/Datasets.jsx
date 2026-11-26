import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Database, FolderKanban, Plus, Search } from 'lucide-react'
import { datasetsApi, projectsApi } from '../services/endpoints'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { formatDate } from '../utils/format'
import EntityModal from '../components/EntityModal'
import { Button, Card, EmptyState, ErrorBanner, Input, LinkButton, PageHeader, PageLoader, Select } from '../components/ui'

export default function Datasets() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(async () => {
    const [datasets, projects] = await Promise.all([datasetsApi.list(), projectsApi.list()])
    return { datasets, projects }
  }, [])

  const [query, setQuery] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [creating, setCreating] = useState(false)

  if (loading && !data) return <PageLoader />
  if (error) return <ErrorBanner message={error} onRetry={reload} />

  const { datasets, projects } = data
  const projectName = Object.fromEntries(projects.map((p) => [p.id, p.name]))
  const needle = query.trim().toLowerCase()
  const visible = datasets.filter((d) =>
    (!projectFilter || String(d.project_id) === projectFilter)
    && (!needle || d.name.toLowerCase().includes(needle) || (d.description || '').toLowerCase().includes(needle)))

  return (
    <>
      <PageHeader
        title="Datasets"
        description="Test cases pair an input with the answer you expect."
        actions={projects.length > 0 && <Button icon={Plus} onClick={() => setCreating(true)}>New dataset</Button>}
      />

      {projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="Create a project first" description="Datasets live inside projects." action={<LinkButton to="/projects?new=1" icon={Plus}>New project</LinkButton>} />
      ) : datasets.length === 0 ? (
        <EmptyState icon={Database} title="No datasets yet" description="Create a dataset, then add test cases to it." action={<Button icon={Plus} onClick={() => setCreating(true)}>New dataset</Button>} />
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative sm:w-72">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search datasets" className="pl-9" aria-label="Search datasets" />
            </div>
            <Select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="sm:w-56" aria-label="Filter by project">
              <option value="">All projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
          {visible.length === 0 ? (
            <EmptyState title="No matching datasets" description="Try a different search or project filter." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((dataset) => (
                <Card key={dataset.id} className="flex flex-col p-5 transition hover:border-accent/40">
                  <Link to={`/datasets/${dataset.id}`} className="text-lg font-semibold hover:text-accent">{dataset.name}</Link>
                  <p className="mt-1 text-xs text-accent">{projectName[dataset.project_id]}</p>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted">{dataset.description || 'No description.'}</p>
                  <p className="mt-4 border-t border-line pt-3 text-xs text-muted">Created {formatDate(dataset.created_at)}</p>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <EntityModal
        open={creating}
        kind="dataset"
        projects={projects}
        onClose={() => setCreating(false)}
        onSaved={(dataset) => { setCreating(false); toast.success('Dataset created. Add some test cases.'); navigate(`/datasets/${dataset.id}`) }}
      />
    </>
  )
}
