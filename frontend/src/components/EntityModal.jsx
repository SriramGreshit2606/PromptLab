import { useEffect, useState } from 'react'
import { datasetsApi, promptsApi, versionsApi } from '../services/endpoints'
import { getErrorMessage } from '../utils/errors'
import { Button, ErrorBanner, Field, Input, Modal, Select, Textarea } from './ui'

// Create / edit form shared by prompts and datasets (both have project_id, name, description).
export default function EntityModal({ open, kind, entity, projects = [], defaultProjectId, onClose, onSaved }) {
  const isPrompt = kind === 'prompt'
  const isEdit = Boolean(entity)
  const api = isPrompt ? promptsApi : datasetsApi
  const label = isPrompt ? 'prompt' : 'dataset'

  const [form, setForm] = useState({ projectId: '', name: '', description: '', content: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({
      projectId: String(defaultProjectId || projects[0]?.id || ''),
      name: entity?.name || '',
      description: entity?.description || '',
      content: '',
    })
    setErrors({})
    setApiError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entity])

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }))

  function validate() {
    const found = {}
    const name = form.name.trim()
    if (!isEdit && !form.projectId) found.projectId = 'Choose a project.'
    if (name.length < 2) found.name = 'Name must be at least 2 characters.'
    else if (name.length > 150) found.name = 'Name must be 150 characters or fewer.'
    if (form.description.length > 2000) found.description = 'Description must be 2000 characters or fewer.'
    if (form.content.length > 10000) found.content = 'Prompt text must be 10000 characters or fewer.'
    return found
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const base = { name: form.name.trim(), description: form.description.trim() || null }
    setSaving(true)
    setApiError('')
    try {
      if (isEdit) {
        onSaved(await api.update(entity.id, base), { edited: true })
        return
      }
      const created = await api.create({ project_id: Number(form.projectId), ...base })
      let versionFailed = false
      if (isPrompt && form.content.trim()) {
        try { await versionsApi.create(created.id, form.content.trim()) } catch { versionFailed = true }
      }
      onSaved(created, { edited: false, versionFailed })
    } catch (error) {
      setApiError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const formId = `${kind}-form`

  return (
    <Modal
      open={open}
      title={`${isEdit ? 'Edit' : 'New'} ${label}`}
      size="lg"
      onClose={saving ? () => {} : onClose}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form={formId} loading={saving}>{isEdit ? 'Save changes' : `Create ${label}`}</Button>
        </>
      )}
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-4">
        <ErrorBanner message={apiError} />
        {!isEdit && (
          <Field label="Project" htmlFor={`${kind}-project`} error={errors.projectId}>
            <Select id={`${kind}-project`} value={form.projectId} onChange={update('projectId')}>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </Select>
          </Field>
        )}
        <Field label="Name" htmlFor={`${kind}-name`} error={errors.name}>
          <Input id={`${kind}-name`} value={form.name} onChange={update('name')} invalid={Boolean(errors.name)} autoFocus maxLength={160} />
        </Field>
        <Field label="Description (optional)" htmlFor={`${kind}-description`} error={errors.description}>
          <Textarea id={`${kind}-description`} rows={3} value={form.description} onChange={update('description')} invalid={Boolean(errors.description)} />
        </Field>
        {isPrompt && !isEdit && (
          <Field label="Prompt text (optional)" htmlFor="prompt-content" error={errors.content} hint="Saved as version 1. You can write it later in the editor.">
            <Textarea id="prompt-content" rows={6} className="font-mono text-[13px]" value={form.content} onChange={update('content')} invalid={Boolean(errors.content)} placeholder="Summarize in one sentence:" />
          </Field>
        )}
      </form>
    </Modal>
  )
}
