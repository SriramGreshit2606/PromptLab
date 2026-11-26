import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { Button, ErrorBanner, Field, Input, NoticeBanner, PasswordInput } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/errors'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate({ email, password }) {
  const errors = {}
  if (!email.trim()) errors.email = 'Enter your email address.'
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address.'
  // The backend rejects passwords shorter than 8 characters on login too.
  if (!password) errors.password = 'Enter your password.'
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters.'
  return errors
}

export default function Login() {
  const { isAuthenticated, login, sessionNotice } = useAuth()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/dashboard'

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to={redirectTo} replace />

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validate(form)
    setErrors(found)
    setApiError('')
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      await login(form.email.trim(), form.password)
    } catch (error) {
      setApiError(getErrorMessage(error, 'Could not log in. Please try again.'))
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue testing your prompts."
      footer={<>New to PromptLab? <Link to="/register" className="font-semibold text-accent hover:underline">Create an account</Link></>}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <NoticeBanner message={sessionNotice} />
        <ErrorBanner message={apiError} />
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input id="email" type="email" autoComplete="email" value={form.email} onChange={update('email')} invalid={Boolean(errors.email)} placeholder="you@example.com" autoFocus />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <PasswordInput id="password" autoComplete="current-password" value={form.password} onChange={update('password')} invalid={Boolean(errors.password)} placeholder="Your password" />
        </Field>
        <Button type="submit" loading={submitting} className="w-full" size="lg">{submitting ? 'Logging in…' : 'Log in'}</Button>
      </form>
    </AuthShell>
  )
}
