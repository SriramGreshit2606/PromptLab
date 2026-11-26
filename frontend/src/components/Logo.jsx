import { Link } from 'react-router-dom'

export default function Logo({ to = '/', className = '' }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2.5 text-xl font-bold tracking-tight ${className}`}>
      <span className="h-3.5 w-3.5 rounded-full bg-accent" aria-hidden="true" />
      PromptLab
    </Link>
  )
}
