import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, FlaskConical, Play, Zap } from 'lucide-react'
import { aiApi, casesApi, datasetsApi, projectsApi, promptsApi, testRunsApi, versionsApi } from '../services/endpoints'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { getErrorMessage } from '../utils/errors'
import { formatMs, formatNumber } from '../utils/format'
import { Button, Card, EmptyState, ErrorBanner, Field, LinkButton, PageHeader, PageLoader, Select } from '../components/ui'

function QuickTest({ content }) {
  const [state, setState] = useState({ loading: false, result: null, error: '' })

  async function run() {
    setState({ loading: true, result: null, error: '' })
    try { setState({ loading: false, result: await aiApi.test(content), error: '' }) }
    catch (error) { setState({ loading: false, result: null, error: getErrorMessage(error) }) }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold"><Zap size={18} className="text-accent" /> Quick check</h2>
          <p className="text-xs text-muted">Sends the selected version’s text to Gemini once. Nothing is saved.</p>
        </div>
        <Button variant="secondary" size="sm" loading={state.loading} onClick={run} disabled={!content}>Try once</Button>
      </div>
      <ErrorBanner message={state.error} className="mt-3" />
      {state.result && (
        <div className="mt-4">
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-bg/60 p-4 text-sm">{state.result.response || '(empty response)'}</pre>
          <p className="mt-2 text-xs text-muted">{formatNumber(state.result.input_tokens)} in · {formatNumber(state.result.output_tokens)} out · {formatMs(state.result.latency_ms)}</p>
        </div>
      )}
    </Card>
  )
}

export default function Playground() {
  const navigate = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()

  const { data, loading, error, reload } = useAsync(async () => {
    const [projects, prompts, datasets] = await Promise.all([projectsApi.list(), promptsApi.list(), datasetsApi.list()])
    return { projects, prompts, datasets }
  }, [])

  const [projectId, setProjectId] = useState('')
  const [promptId, setPromptId] = useState('')
  const [versionId, setVersionId] = useState('')
  const [datasetId, setDatasetId] = useState('')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(null)
  const [runError, setRunError] = useState('')
  const [failedRunId, setFailedRunId] = useState(null)
  const baseline = useRef(0)
  const initialised = useRef(false)

  // Pre-select from ?prompt= / ?dataset= (links from the prompt and dataset pages).
  useEffect(() => {
    if (!data || initialised.current) return
    initialised.current = true
    const prompt = data.prompts.find((p) => String(p.id) === params.get('prompt'))
    const dataset = data.datasets.find((d) => String(d.id) === params.get('dataset'))
    const project = prompt?.project_id ?? dataset?.project_id ?? data.projects[0]?.id
    if (project) setProjectId(String(project))
    if (prompt) setPromptId(String(prompt.id))
    if (dataset && (!prompt || dataset.project_id === prompt.project_id)) setDatasetId(String(dataset.id))
  }, [data, params])

  const versions = useAsync(() => (promptId ? versionsApi.list(promptId) : Promise.resolve([])), [promptId])
  const cases = useAsync(() => (datasetId ? casesApi.list(datasetId) : Promise.resolve([])), [datasetId])

  useEffect(() => {
    if (versions.data?.length) setVersionId(String(versions.data[0].id))
    else setVersionId('')
  }, [versions.data])

  // While the (blocking) run request is open, poll the runs list for live progress.
  useEffect(() => {
    if (!running) return undefined
    const timer = setInterval(async () => {
      try {
        const runs = await testRunsApi.list()
        const current = runs.find((r) => r.id > baseline.current && r.prompt_version_id === Number(versionId) && r.dataset_id === Number(datasetId))
        if (current) setProgress(current)
      } catch { /* keep the last known progress */ }
    }, 2000)
    return () => clearInterval(timer)
  }, [running, versionId, datasetId])

  if (loading && !data) return <PageLoader />
  if (error) return <ErrorBanner message={error} onRetry={reload} />

  const { projects, prompts, datasets } = data
  const projectPrompts = prompts.filter((p) => String(p.project_id) === projectId)
  const projectDatasets = datasets.filter((d) => String(d.project_id) === projectId)
  const selectedVersion = versions.data?.find((v) => String(v.id) === versionId)
  const caseCount = cases.data?.length ?? 0
  const ready = Boolean(versionId && datasetId && caseCount > 0) && !cases.loading

  function changeProject(value) { setProjectId(value); setPromptId(''); setDatasetId('') }

  async function start() {
    setRunError('')
    setFailedRunId(null)
    setProgress(null)
    setRunning(true)
    try {
      const existing = await testRunsApi.list()
      baseline.current = Math.max(0, ...existing.map((r) => r.id))
    } catch { baseline.current = 0 }

    try {
      const run = await testRunsApi.create({ prompt_version_id: Number(versionId), dataset_id: Number(datasetId) })
      toast.success('Test run completed.')
      navigate(`/runs/${run.id}`)
    } catch (err) {
      setRunError(getErrorMessage(err))
      setRunning(false)
      try {
        const runs = await testRunsApi.list()
        const failed = runs.find((r) => r.id > baseline.current && r.prompt_version_id === Number(versionId))
        if (failed) setFailedRunId(failed.id)
      } catch { /* ignore */ }
    }
  }

  if (projects.length === 0 || prompts.length === 0 || datasets.length === 0) {
    const missing = projects.length === 0 ? 'a project' : prompts.length === 0 ? 'a prompt with at least one version' : 'a dataset with test cases'
    return (
      <>
        <PageHeader title="Testing playground" description="Run a prompt version against a dataset." />
        <EmptyState icon={FlaskConical} title="Nothing to test yet" description={`Create ${missing} first.`} action={<LinkButton to={projects.length === 0 ? '/projects?new=1' : prompts.length === 0 ? '/prompts' : '/datasets'}>Get started</LinkButton>} />
      </>
    )
  }

  const pct = progress?.total_cases ? Math.round((progress.completed_cases / progress.total_cases) * 100) : 0

  return (
    <>
      <PageHeader title="Testing playground" description="Run a prompt version against every case in a dataset and score the responses." />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <Card className="p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Project" htmlFor="pg-project">
                <Select id="pg-project" value={projectId} onChange={(e) => changeProject(e.target.value)} disabled={running}>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
              </Field>
              <Field label="Dataset" htmlFor="pg-dataset" hint={datasetId && !cases.loading ? `${caseCount} test case${caseCount === 1 ? '' : 's'}` : undefined}>
                <Select id="pg-dataset" value={datasetId} onChange={(e) => setDatasetId(e.target.value)} disabled={running}>
                  <option value="">Choose a dataset</option>
                  {projectDatasets.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              </Field>
              <Field label="Prompt" htmlFor="pg-prompt">
                <Select id="pg-prompt" value={promptId} onChange={(e) => setPromptId(e.target.value)} disabled={running}>
                  <option value="">Choose a prompt</option>
                  {projectPrompts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
              </Field>
              <Field label="Version" htmlFor="pg-version">
                <Select id="pg-version" value={versionId} onChange={(e) => setVersionId(e.target.value)} disabled={running || !promptId}>
                  <option value="">{promptId ? (versions.loading ? 'Loading…' : 'No versions') : 'Choose a prompt first'}</option>
                  {(versions.data || []).map((v) => <option key={v.id} value={v.id}>v{v.version_number}{v.id === versions.data[0].id ? ' (latest)' : ''}</option>)}
                </Select>
              </Field>
            </div>

            {projectPrompts.length === 0 && <p className="mt-3 text-xs text-warn">This project has no prompts. <Link to="/prompts" className="underline">Create one</Link>.</p>}
            {promptId && !versions.loading && versions.data?.length === 0 && <p className="mt-3 text-xs text-warn">This prompt has no versions yet. <Link to={`/prompts/${promptId}`} className="underline">Write and save one</Link>.</p>}
            {datasetId && !cases.loading && caseCount === 0 && <p className="mt-3 text-xs text-warn">This dataset has no test cases. <Link to={`/datasets/${datasetId}`} className="underline">Add some</Link>.</p>}
            <ErrorBanner message={versions.error || cases.error} className="mt-3" />

            {selectedVersion && (
              <div className="mt-4">
                <p className="mb-1.5 text-xs text-muted">Version v{selectedVersion.version_number} text</p>
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-bg/60 p-3 font-mono text-[13px]">{selectedVersion.content}</pre>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button size="lg" icon={Play} onClick={start} loading={running} disabled={!ready}>{running ? 'Running…' : 'Run test'}</Button>
              {ready && !running && <span className="text-xs text-muted">Makes {caseCount} Gemini call{caseCount === 1 ? '' : 's'}. Model and settings are set by the backend.</span>}
            </div>
          </Card>

          {running && (
            <Card className="p-5" aria-live="polite">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold">Running test…</span>
                <span className="text-muted">{progress ? `${progress.completed_cases} / ${progress.total_cases} cases` : 'Starting…'}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-raised"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress ? Math.max(pct, 4) : 4}%` }} /></div>
              <p className="mt-3 flex items-start gap-2 text-xs text-muted"><AlertTriangle size={14} className="mt-0.5 shrink-0 text-warn" /> Keep this page open. The run happens in a single request and can’t be cancelled; you’ll be taken to the results when it finishes.</p>
            </Card>
          )}

          {runError && (
            <div>
              <ErrorBanner message={runError} />
              {failedRunId && <p className="mt-2 text-sm"><Link to={`/runs/${failedRunId}`} className="text-accent hover:underline">View the partial results of run #{failedRunId}</Link></p>}
            </div>
          )}
        </div>

        <QuickTest content={selectedVersion?.content} />
      </div>
    </>
  )
}
