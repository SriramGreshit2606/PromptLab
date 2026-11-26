import { useEffect, useState } from 'react'
import { projectsApi } from '../services/endpoints'
import { getErrorMessage } from '../utils/errors'
import { Button, ErrorBanner, Field, Input, Modal, Textarea } from './ui'

// Backend limits (schemas/project.py): name 2-150 chars, description up to 2000.
function validate({ name, description }) {
  const errors = {}
  const trimmed = name.trim()
  if (trimmed.length < 2) errors.name = 'Name must be at least 2 characters.'
  else if (trimmed.length > 150) errors.name = 'Name must be 150 characters or fewer.'
  if (description.length > 2000) errors.description = 'Description must be 2000 characters or fewer.'
  return errors
}

export default function ProjectFormModal({ open, project, onClose, onSaved }) {
  const isEdit = Boolean(project)
  const [form, setForm] = useState({ name: '', description: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({ name: project?.name || '', description: project?.description || '' })
      setErrors({})
      setApiError('')
    }
  }, [open, project])

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const payload = { name: form.name.trim(), description: form.description.trim() || null }
    setSaving(true)
    setApiError('')
    try {
      const saved = isEdit ? await projectsApi.update(project.id, payload) : await projectsApi.create(payload)
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
      title={isEdit ? 'Edit project' : 'New project'}
      onClose={saving ? () => {} : onClose}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="project-form" loading={saving}>{isEdit ? 'Save changes' : 'Create project'}</Button>
        </>
      )}
    >
      <form id="project-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <ErrorBanner message={apiError} />
        <Field label="Project name" htmlFor="project-name" error={errors.name}>
          <Input id="project-name" value={form.name} onChange={update('name')} invalid={Boolean(errors.name)} placeholder="e.g. Support ticket summarizer" autoFocus maxLength={160} />
        </Field>
        <Field label="Description (optional)" htmlFor="project-description" error={errors.description} hint="What are you building prompts for?">
          <Textarea id="project-description" value={form.description} onChange={update('description')} invalid={Boolean(errors.description)} rows={4} />
        </Field>
      </form>
    </Modal>
  )
}
