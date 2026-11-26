import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, FlaskConical, History, Pencil, RotateCcw, Save } from 'lucide-react'
import { projectsApi, promptsApi, versionsApi } from '../services/endpoints'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { getErrorMessage } from '../utils/errors'
import { formatDateTime } from '../utils/format'
import { detectVariables, fillVariables } from '../utils/variables'
import { diffLines } from '../utils/diff'
import EntityModal from '../components/EntityModal'
import { Badge, Button, Card, EmptyState, ErrorBanner, Field, Input, LinkButton, PageHeader, PageLoader, Select, Textarea, cx } from '../components/ui'

const MAX_CONTENT = 10000

function VersionDiff({ versions, draft }) {
  const [fromId, setFromId] = useState(String(versions[1]?.id ?? versions[0]?.id ?? ''))
  const [toId, setToId] = useState(String(versions[0]?.id ?? ''))

  const textOf = (id) => (id === 'draft' ? draft : versions.find((v) => String(v.id) === id)?.content ?? '')
  const lines = useMemo(() => diffLines(textOf(fromId), textOf(toId)), [fromId, toId, draft, versions]) // eslint-disable-line react-hooks/exhaustive-deps
  const changed = lines.some((l) => l.type !== 'same')

  const options = (withDraft) => (
    <>
      {withDraft && <option value="draft">Editor (unsaved)</option>}
      {versions.map((v) => <option key={v.id} value={v.id}>v{v.version_number}</option>)}
    </>
  )

  return (
    <Card className="p-5">
      <h2 className="font-semibold">Compare versions</h2>
      <div className="mb-4 mt-3 flex flex-wrap items-center gap-3 text-sm">
        <Select value={fromId} onChange={(e) => setFromId(e.target.value)} className="w-40" aria-label="From version">{options(false)}</Select>
        <span className="text-muted">→</span>
        <Select value={toId} onChange={(e) => setToId(e.target.value)} className="w-44" aria-label="To version">{options(true)}</Select>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line bg-bg/60 py-2 font-mono text-[13px]">
        {!changed && <p className="px-4 py-2 text-muted">No differences.</p>}
        {changed && lines.map((line, index) => (
          <div key={index} className={cx('whitespace-pre-wrap px-4 py-0.5', line.type === 'add' && 'bg-good/10 text-good', line.type === 'del' && 'bg-bad/10 text-bad', line.type === 'same' && 'text-muted')}>
            <span className="mr-3 select-none opacity-70">{line.type === 'add' ? '+' : line.type === 'del' ? '−' : ' '}</span>{line.text || ' '}
          </div>
        ))}
      </div>
    </Card>
  )
}

function Workspace({ prompt, versions, reload }) {
  const toast = useToast()
  const latest = versions[0]
  const [content, setContent] = useState(latest?.content || '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [viewing, setViewing] = useState(null)
  const [restoringId, setRestoringId] = useState(null)
  const [samples, setSamples] = useState({})

  const nextNumber = (latest?.version_number || 0) + 1
  const dirty = content.trim() !== (latest?.content || '')
  const tooLong = content.length > MAX_CONTENT
  const variables = detectVariables(content)
  const missing = variables.filter((name) => !samples[name]?.trim())

  async function save() {
    setSaving(true)
    setSaveError('')
    try {
      await versionsApi.create(prompt.id, content.trim())
      toast.success(`Saved as v${nextNumber}.`)
      reload()
    } catch (error) {
      setSaveError(getErrorMessage(error))
      setSaving(false)
    }
  }

  async function restore(version) {
    setRestoringId(version.id)
    try {
      const created = await versionsApi.restore(prompt.id, version.id)
      toast.success(`v${version.version_number} restored as v${created.version_number}.`)
      reload()
    } catch (error) {
      toast.error(getErrorMessage(error))
      setRestoringId(null)
    }
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Editor</h2>
              <Badge tone="accent">{latest ? `Based on v${latest.version_number}` : 'No versions yet'}</Badge>
            </div>
            <ErrorBanner message={saveError} className="mb-3" />
            <Textarea
              aria-label="Prompt text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              invalid={tooLong}
              rows={12}
              className="font-mono text-[13px] leading-relaxed"
              placeholder="Write your prompt. Use {{variable}} for placeholders."
            />
            <div className="mt-2 flex items-center justify-between text-xs text-muted">
              <span className={tooLong ? 'text-bad' : ''}>{content.length.toLocaleString()} / {MAX_CONTENT.toLocaleString()} characters</span>
              {dirty && <span className="text-warn">Unsaved changes</span>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button icon={Save} onClick={save} loading={saving} disabled={!content.trim() || !dirty || tooLong}>Save as v{nextNumber}</Button>
              {dirty && latest && <Button variant="ghost" onClick={() => setContent(latest.content)}>Discard changes</Button>}
              {latest && <LinkButton to={`/playground?prompt=${prompt.id}`} variant="secondary" icon={FlaskConical}>Test this prompt</LinkButton>}
            </div>
            <p className="mt-3 text-xs text-muted">Saving never overwrites older versions. The backend stores the text only (no change note, author or model settings).</p>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold">Variables and preview</h2>
            {variables.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No <code className="font-mono">{'{{variables}}'}</code> found in this prompt.</p>
            ) : (
              <>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {variables.map((name) => (
                    <Field key={name} label={name} htmlFor={`var-${name}`}>
                      <Input id={`var-${name}`} value={samples[name] || ''} onChange={(e) => setSamples((s) => ({ ...s, [name]: e.target.value }))} placeholder="Sample value" />
                    </Field>
                  ))}
                </div>
                {missing.length > 0 && <p className="mt-3 text-xs text-warn">Missing sample value for: {missing.join(', ')}</p>}
                <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-bg/60 p-4 font-mono text-[13px]">{fillVariables(content, samples)}</pre>
              </>
            )}
            <p className="mt-3 text-xs text-muted">Preview only. During test runs the backend does not substitute variables; it sends this prompt followed by each test case’s input text.</p>
          </Card>
        </div>

        <Card className="h-fit p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><History size={18} className="text-accent" /> Versions</h2>
          {versions.length === 0 ? (
            <EmptyState title="No versions yet" description="Write the prompt and save it to create v1." />
          ) : (
            <ol className="relative space-y-4 border-l border-line pl-5">
              {versions.map((version, index) => (
                <li key={version.id} className="relative">
                  <span className={cx('absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2', index === 0 ? 'border-accent bg-accent' : 'border-muted bg-card')} />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">v{version.version_number} {index === 0 && <Badge tone="accent" className="ml-1">Latest</Badge>}</p>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" icon={Eye} onClick={() => setViewing(version)} aria-label={`View v${version.version_number}`} />
                      {index > 0 && <Button size="sm" variant="ghost" icon={RotateCcw} loading={restoringId === version.id} onClick={() => restore(version)} aria-label={`Restore v${version.version_number}`} title="Restore as a new version" />}
                    </div>
                  </div>
                  <p className="text-xs text-muted">{formatDateTime(version.created_at)}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted/80">{version.content}</p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      {versions.length >= 1 && <div className="mt-4"><VersionDiff versions={versions} draft={content} /></div>}

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setViewing(null) }}>
          <div role="dialog" aria-modal="true" className="w-full max-w-2xl rounded-2xl border border-line bg-card p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Version v{viewing.version_number}</h2>
              <span className="text-xs text-muted">{formatDateTime(viewing.created_at)}</span>
            </div>
            <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-bg/60 p-4 font-mono text-[13px]">{viewing.content}</pre>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => setViewing(null)}>Close</Button>
              <Button variant="secondary" onClick={() => { setContent(viewing.content); setViewing(null) }}>Load into editor</Button>
              {viewing.id !== latest?.id && <Button icon={RotateCcw} loading={restoringId === viewing.id} onClick={async () => { await restore(viewing); setViewing(null) }}>Restore as new version</Button>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function PromptDetail() {
  const { promptId } = useParams()
  const [editing, setEditing] = useState(false)
  const toast = useToast()

  const { data, loading, error, reload } = useAsync(async () => {
    const [prompt, versions] = await Promise.all([promptsApi.get(promptId), versionsApi.list(promptId)])
    const project = await projectsApi.get(prompt.project_id).catch(() => null)
    return { prompt, versions, project }
  }, [promptId])

  const back = (
    <Link to="/prompts" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"><ArrowLeft size={16} /> All prompts</Link>
  )

  if (loading && !data) return <PageLoader />
  if (error) return <><div>{back}</div><ErrorBanner message={error} onRetry={reload} /></>

  const { prompt, versions, project } = data

  return (
    <>
      <PageHeader
        back={back}
        title={prompt.name}
        description={prompt.description || (project ? `Project: ${project.name}` : undefined)}
        actions={<Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>Edit details</Button>}
      />
      {prompt.description && project && <p className="-mt-3 mb-6 text-xs text-muted">Project: <Link className="text-accent hover:underline" to={`/projects/${project.id}`}>{project.name}</Link></p>}

      <Workspace key={versions[0]?.id ?? 'none'} prompt={prompt} versions={versions} reload={reload} />

      <EntityModal open={editing} kind="prompt" entity={prompt} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); toast.success('Prompt updated.'); reload() }} />
    </>
  )
}
