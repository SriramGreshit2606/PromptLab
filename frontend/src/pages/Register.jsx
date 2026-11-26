import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { Button, ErrorBanner, Field, Input, PasswordInput } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/errors'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Limits mirror backend schemas/user.py: full_name 2-100, password 8-128.
function validate({ fullName, email, password, confirm }) {
  const errors = {}
  const name = fullName.trim()
  if (name.length < 2) errors.fullName = 'Name must be at least 2 characters.'
  else if (name.length > 100) errors.fullName = 'Name must be 100 characters or fewer.'

  if (!email.trim()) errors.email = 'Enter your email address.'
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address.'

  if (password.length < 8) errors.password = 'Password must be at least 8 characters.'
  else if (password.length > 128) errors.password = 'Password must be 128 characters or fewer.'

  // Confirmation is checked in the browser only; the backend does not take a second field.
  if (!confirm) errors.confirm = 'Confirm your password.'
  else if (confirm !== password) errors.confirm = 'Passwords do not match.'
  return errors
}

export default function Register() {
  const { isAuthenticated, register } = useAuth()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validate(form)
    setErrors(found)
    setApiError('')
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      await register({ fullName: form.fullName.trim(), email: form.email.trim(), password: form.password })
    } catch (error) {
      setApiError(getErrorMessage(error, 'Could not create your account. Please try again.'))
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start versioning and testing your prompts."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-accent hover:underline">Log in</Link></>}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <ErrorBanner message={apiError} />
        <Field label="Full name" htmlFor="fullName" error={errors.fullName}>
          <Input id="fullName" autoComplete="name" value={form.fullName} onChange={update('fullName')} invalid={Boolean(errors.fullName)} placeholder="Your name" autoFocus />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input id="email" type="email" autoComplete="email" value={form.email} onChange={update('email')} invalid={Boolean(errors.email)} placeholder="you@example.com" />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters.">
          <PasswordInput id="password" autoComplete="new-password" value={form.password} onChange={update('password')} invalid={Boolean(errors.password)} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" error={errors.confirm}>
          <PasswordInput id="confirm" autoComplete="new-password" value={form.confirm} onChange={update('confirm')} invalid={Boolean(errors.confirm)} />
        </Field>
        <Button type="submit" loading={submitting} className="w-full" size="lg">{submitting ? 'Creating account…' : 'Create account'}</Button>
      </form>
    </AuthShell>
  )
}
