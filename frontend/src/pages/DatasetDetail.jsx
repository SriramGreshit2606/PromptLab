import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FlaskConical, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react'
import { casesApi, datasetsApi, projectsApi } from '../services/endpoints'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { getErrorMessage } from '../utils/errors'
import { formatDate } from '../utils/format'
import EntityModal from '../components/EntityModal'
import { Button, Card, ConfirmDialog, EmptyState, ErrorBanner, Field, IconButton, LinkButton, Modal, PageHeader, PageLoader, Textarea } from '../components/ui'

// Backend limits (schemas/dataset_case.py): both fields required, 1-10000 characters.
function CaseModal({ open, datasetId, testCase, onClose, onSaved }) {
  const isEdit = Boolean(testCase)
  const [form, setForm] = useState({ input: '', expected: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({ input: testCase?.input_text || '', expected: testCase?.expected_output || '' })
      setErrors({})
      setApiError('')
    }
  }, [open, testCase])

  async function submit(event) {
    event.preventDefault()
    const found = {}
    if (!form.input.trim()) found.input = 'Enter the test input.'
    else if (form.input.length > 10000) found.input = 'Keep the input under 10000 characters.'
    if (!form.expected.trim()) found.expected = 'Enter the expected answer.'
    else if (form.expected.length > 10000) found.expected = 'Keep the answer under 10000 characters.'
    setErrors(found)
    if (Object.keys(found).length) return

    const payload = { input_text: form.input.trim(), expected_output: form.expected.trim() }
    setSaving(true)
    setApiError('')
    try {
      const saved = isEdit ? await casesApi.update(datasetId, testCase.id, payload) : await casesApi.create(datasetId, payload)
      onSaved(saved, isEdit)
    } catch (error) {
      setApiError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit test case' : 'Add test case'}
      size="lg"
      onClose={saving ? () => {} : onClose}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="case-form" loading={saving}>{isEdit ? 'Save changes' : 'Add test case'}</Button>
        </>
      )}
    >
      <form id="case-form" onSubmit={submit} noValidate className="space-y-4">
        <ErrorBanner message={apiError} />
        <Field label="Input" htmlFor="case-input" error={errors.input} hint="Sent to the model after the prompt text as “User input”.">
          <Textarea id="case-input" rows={5} value={form.input} onChange={(e) => setForm((f) => ({ ...f, input: e.target.value }))} invalid={Boolean(errors.input)} autoFocus />
        </Field>
        <Field label="Expected answer" htmlFor="case-expected" error={errors.expected} hint="The model’s response is scored by text similarity to this.">
          <Textarea id="case-expected" rows={5} value={form.expected} onChange={(e) => setForm((f) => ({ ...f, expected: e.target.value }))} invalid={Boolean(errors.expected)} />
        </Field>
      </form>
    </Modal>
  )
}

export default function DatasetDetail() {
  const { datasetId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const { data, loading, error, reload } = useAsync(async () => {
    const [dataset, cases] = await Promise.all([datasetsApi.get(datasetId), casesApi.list(datasetId)])
    const project = await projectsApi.get(dataset.project_id).catch(() => null)
    return { dataset, cases, project }
  }, [datasetId])

  const [editingDataset, setEditingDataset] = useState(false)
  const [deletingDataset, setDeletingDataset] = useState(false)
  const [caseModal, setCaseModal] = useState({ open: false, testCase: null })
  const [deletingCase, setDeletingCase] = useState(null)
  const [busy, setBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function runDelete(action, onDone) {
    setBusy(true)
    setDeleteError('')
    try { await action(); onDone() } catch (err) { setDeleteError(getErrorMessage(err)) } finally { setBusy(false) }
  }

  const back = <Link to="/datasets" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"><ArrowLeft size={16} /> All datasets</Link>

  if (loading && !data) return <PageLoader />
  if (error) return <><div>{back}</div><ErrorBanner message={error} onRetry={reload} /></>

  const { dataset, cases, project } = data

  return (
    <>
      <PageHeader
        back={back}
        title={dataset.name}
        description={dataset.description || undefined}
        actions={(
          <>
            {cases.length > 0 && <LinkButton to={`/playground?dataset=${dataset.id}`} icon={FlaskConical}>Run a test</LinkButton>}
            <Button variant="secondary" icon={Pencil} onClick={() => setEditingDataset(true)}>Edit</Button>
            <Button variant="danger" icon={Trash2} onClick={() => { setDeleteError(''); setDeletingDataset(true) }}>Delete</Button>
          </>
        )}
      />
      <p className="-mt-3 mb-6 text-xs text-muted">
        {project && <>Project: <Link className="text-accent hover:underline" to={`/projects/${project.id}`}>{project.name}</Link> · </>}
        Created {formatDate(dataset.created_at)}
      </p>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold"><ListChecks size={18} className="text-accent" /> Test cases ({cases.length})</h2>
          <Button size="sm" icon={Plus} onClick={() => setCaseModal({ open: true, testCase: null })}>Add test case</Button>
        </div>

        {cases.length === 0 ? (
          <EmptyState icon={ListChecks} title="No test cases yet" description="Add an input and the answer you expect. A dataset needs at least one case to be tested." action={<Button icon={Plus} onClick={() => setCaseModal({ open: true, testCase: null })}>Add test case</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="w-10 pb-2 font-normal">#</th>
                  <th className="pb-2 font-normal">Input</th>
                  <th className="pb-2 font-normal">Expected answer</th>
                  <th className="w-24 pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line align-top">
                {cases.map((testCase, index) => (
                  <tr key={testCase.id}>
                    <td className="py-3 text-muted">{index + 1}</td>
                    <td className="max-w-xs py-3 pr-4"><p className="line-clamp-3 whitespace-pre-wrap">{testCase.input_text}</p></td>
                    <td className="max-w-xs py-3 pr-4"><p className="line-clamp-3 whitespace-pre-wrap text-muted">{testCase.expected_output}</p></td>
                    <td className="py-2">
                      <div className="flex justify-end gap-1">
                        <IconButton label={`Edit case ${index + 1}`} onClick={() => setCaseModal({ open: true, testCase })}><Pencil size={16} /></IconButton>
                        <IconButton label={`Delete case ${index + 1}`} tone="danger" onClick={() => { setDeleteError(''); setDeletingCase(testCase) }}><Trash2 size={16} /></IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CaseModal
        open={caseModal.open}
        datasetId={dataset.id}
        testCase={caseModal.testCase}
        onClose={() => setCaseModal({ open: false, testCase: null })}
        onSaved={(_saved, wasEdit) => { setCaseModal({ open: false, testCase: null }); toast.success(wasEdit ? 'Test case updated.' : 'Test case added.'); reload() }}
      />

      <EntityModal open={editingDataset} kind="dataset" entity={dataset} onClose={() => setEditingDataset(false)} onSaved={() => { setEditingDataset(false); toast.success('Dataset updated.'); reload() }} />

      <ConfirmDialog
        open={Boolean(deletingCase)}
        title="Delete test case?"
        message="This test case will be removed from the dataset, and its results in past test runs will be deleted too (the runs’ saved averages are not recalculated)."
        loading={busy}
        error={deleteError}
        onClose={() => setDeletingCase(null)}
        onConfirm={() => runDelete(() => casesApi.remove(dataset.id, deletingCase.id), () => { setDeletingCase(null); toast.success('Test case deleted.'); reload() })}
      />

      <ConfirmDialog
        open={deletingDataset}
        title="Delete dataset?"
        message={`“${dataset.name}” and all of its test cases will be permanently deleted. Test runs that used it will be deleted too.`}
        loading={busy}
        error={deleteError}
        onClose={() => setDeletingDataset(false)}
        onConfirm={() => runDelete(() => datasetsApi.remove(dataset.id), () => { toast.success('Dataset deleted.'); navigate('/datasets', { replace: true }) })}
      />
    </>
  )
}
