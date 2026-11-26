import Logo from '../components/Logo'
import { LinkButton } from '../components/ui'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-5 text-center">
      <Logo />
      <h1 className="text-5xl font-bold">404</h1>
      <p className="text-muted">That page doesn’t exist.</p>
      <LinkButton to="/">Back to home</LinkButton>
    </div>
  )
}
