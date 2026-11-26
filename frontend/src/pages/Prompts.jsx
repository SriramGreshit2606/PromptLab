import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, FolderKanban, Plus, Search } from 'lucide-react'
import { projectsApi, promptsApi } from '../services/endpoints'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { formatDate } from '../utils/format'
import EntityModal from '../components/EntityModal'
import { Button, Card, EmptyState, ErrorBanner, Input, LinkButton, PageHeader, PageLoader, Select } from '../components/ui'

export default function Prompts() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(async () => {
    const [prompts, projects] = await Promise.all([promptsApi.list(), projectsApi.list()])
    return { prompts, projects }
  }, [])

  const [query, setQuery] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [creating, setCreating] = useState(false)

  function handleSaved(prompt, { versionFailed }) {
    setCreating(false)
    if (versionFailed) toast.error('Prompt created, but its first version could not be saved. Add it in the editor.')
    else toast.success('Prompt created.')
    navigate(`/prompts/${prompt.id}`)
  }

  if (loading && !data) return <PageLoader />
  if (error) return <ErrorBanner message={error} onRetry={reload} />

  const { prompts, projects } = data
  const projectName = Object.fromEntries(projects.map((p) => [p.id, p.name]))
  const needle = query.trim().toLowerCase()
  const visible = prompts.filter((p) =>
    (!projectFilter || String(p.project_id) === projectFilter)
    && (!needle || p.name.toLowerCase().includes(needle) || (p.description || '').toLowerCase().includes(needle)))

  return (
    <>
      <PageHeader
        title="Prompts"
        description="Every prompt keeps its full version history."
        actions={projects.length > 0 && <Button icon={Plus} onClick={() => setCreating(true)}>New prompt</Button>}
      />

      {projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="Create a project first" description="Prompts live inside projects." action={<LinkButton to="/projects?new=1" icon={Plus}>New project</LinkButton>} />
      ) : prompts.length === 0 ? (
        <EmptyState icon={FileText} title="No prompts yet" description="Create a prompt, then keep refining it as new versions." action={<Button icon={Plus} onClick={() => setCreating(true)}>New prompt</Button>} />
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative sm:w-72">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prompts" className="pl-9" aria-label="Search prompts" />
            </div>
            <Select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="sm:w-56" aria-label="Filter by project">
              <option value="">All projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>

          {visible.length === 0 ? (
            <EmptyState title="No matching prompts" description="Try a different search or project filter." />
          ) : (
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="border-b border-line text-xs text-muted">
                  <tr>
                    <th className="px-5 py-3 font-normal">Prompt</th>
                    <th className="px-5 py-3 font-normal">Project</th>
                    <th className="px-5 py-3 font-normal">Created</th>
                    <th className="px-5 py-3 font-normal">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visible.map((prompt) => (
                    <tr key={prompt.id} className="hover:bg-raised/40">
                      <td className="max-w-xs px-5 py-3.5">
                        <Link to={`/prompts/${prompt.id}`} className="font-medium hover:text-accent">{prompt.name}</Link>
                        {prompt.description && <p className="truncate text-xs text-muted">{prompt.description}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-muted">{projectName[prompt.project_id] || '—'}</td>
                      <td className="px-5 py-3.5 text-muted">{formatDate(prompt.created_at)}</td>
                      <td className="px-5 py-3.5 text-muted">{formatDate(prompt.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}

      <EntityModal open={creating} kind="prompt" projects={projects} onClose={() => setCreating(false)} onSaved={handleSaved} />
    </>
  )
}
