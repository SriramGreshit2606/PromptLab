import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FolderKanban, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { projectsApi } from '../services/endpoints'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { getErrorMessage } from '../utils/errors'
import { formatDate } from '../utils/format'
import ProjectFormModal from '../components/ProjectFormModal'
import { Button, Card, ConfirmDialog, EmptyState, ErrorBanner, IconButton, Input, PageHeader, PageLoader } from '../components/ui'

export default function Projects() {
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: projects, loading, error, reload } = useAsync(() => projectsApi.list(), [])

  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null) // project being edited
  const [creating, setCreating] = useState(searchParams.get('new') === '1')
  const [deleting, setDeleting] = useState(null) // project pending deletion
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  function closeForm() {
    setCreating(false)
    setEditing(null)
    if (searchParams.has('new')) setSearchParams({}, { replace: true })
  }

  function handleSaved(_project, wasEdit) {
    closeForm()
    toast.success(wasEdit ? 'Project updated.' : 'Project created.')
    reload()
  }

  async function confirmDelete() {
    setDeleteBusy(true)
    setDeleteError('')
    try {
      await projectsApi.remove(deleting.id)
      toast.success(`“${deleting.name}” was deleted.`)
      setDeleting(null)
      reload()
    } catch (err) {
      setDeleteError(getErrorMessage(err))
    } finally {
      setDeleteBusy(false)
    }
  }

  const visible = (projects || []).filter((p) => {
    const needle = query.trim().toLowerCase()
    return !needle || p.name.toLowerCase().includes(needle) || (p.description || '').toLowerCase().includes(needle)
  })

  return (
    <>
      <PageHeader
        title="Projects"
        description="Each project groups the prompts, datasets and test runs for one use case."
        actions={<Button icon={Plus} onClick={() => setCreating(true)}>New project</Button>}
      />

      {loading && <PageLoader />}
      <ErrorBanner message={error} onRetry={reload} />

      {!loading && !error && projects.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title="Create your first project"
          description="A project is where your prompts, test datasets and results live together."
          action={<Button icon={Plus} onClick={() => setCreating(true)}>New project</Button>}
        />
      )}

      {!loading && !error && projects.length > 0 && (
        <>
          <div className="relative mb-5 max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects" className="pl-9" aria-label="Search projects" />
          </div>

          {visible.length === 0 ? (
            <EmptyState title="No matching projects" description={`Nothing matches “${query}”.`} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((project) => (
                <Card key={project.id} className="flex flex-col p-5 transition hover:border-accent/40">
                  <Link to={`/projects/${project.id}`} className="text-lg font-semibold hover:text-accent">{project.name}</Link>
                  <p className="mt-1.5 line-clamp-3 flex-1 text-sm text-muted">{project.description || 'No description.'}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                    <span className="text-xs text-muted">Created {formatDate(project.created_at)}</span>
                    <div className="flex items-center gap-1">
                      <IconButton label={`Edit ${project.name}`} onClick={() => setEditing(project)}><Pencil size={16} /></IconButton>
                      <IconButton label={`Delete ${project.name}`} tone="danger" onClick={() => { setDeleteError(''); setDeleting(project) }}><Trash2 size={16} /></IconButton>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <ProjectFormModal open={creating || Boolean(editing)} project={editing} onClose={closeForm} onSaved={handleSaved} />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete project?"
        message={deleting ? `“${deleting.name}” and everything inside it (prompts, versions, datasets and test runs) will be permanently deleted. This cannot be undone.` : ''}
        loading={deleteBusy}
        error={deleteError}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  )
}
