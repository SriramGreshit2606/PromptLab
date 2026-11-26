import { Link } from 'react-router-dom'
import { BarChart3, FlaskConical, GitBranch } from 'lucide-react'
import Logo from '../components/Logo'
import { LinkButton, buttonClasses } from '../components/ui'
import { useAuth } from '../context/AuthContext'

// Illustrative numbers only, labelled as a sample on the page.
const SAMPLE_ROWS = [
  { label: 'Avg. similarity score', v1: '54%', v2: '83%' },
  { label: 'Total tokens', v1: '1,240', v2: '860' },
  { label: 'Total latency', v1: '1.6 s', v2: '1.4 s' },
]

const VERSIONS = [
  { tag: 'v3', note: 'Added output format', current: true },
  { tag: 'v2', note: 'Ask for one sentence' },
  { tag: 'v1', note: 'Initial version' },
]

function Section({ icon: Icon, title, text, children }) {
  return (
    <section className="border-t border-line py-14">
      <div className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
        <div>
          <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent"><Icon size={20} /></span>
          <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
          <p className="mt-3 max-w-lg text-muted">{text}</p>
        </div>
        <div>{children}</div>
      </div>
    </section>
  )
}

function Bar({ label, value, tone }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted"><span>{label}</span><span>{value}%</span></div>
      <div className="h-2.5 overflow-hidden rounded-full bg-raised">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export default function Landing() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <Logo />
        <nav className="flex items-center gap-2" aria-label="Account">
          {isAuthenticated ? (
            <LinkButton to="/dashboard" size="sm">Open dashboard</LinkButton>
          ) : (
            <>
              <Link to="/login" className={buttonClasses('secondary', 'sm')}>Log in</Link>
              <Link to="/register" className={buttonClasses('primary', 'sm')}>Sign up</Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5">
        {/* Hero */}
        <section className="grid items-center gap-12 pb-16 pt-10 lg:grid-cols-[1.15fr_1fr] lg:pt-16">
          <div>
            <h1 className="text-5xl font-extrabold leading-[1.04] sm:text-6xl">Stop guessing which prompt is better.</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              PromptLab saves every prompt change as a version, runs it against your test cases, and scores the results, so you can see what actually improved.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton to={isAuthenticated ? '/dashboard' : '/register'} size="lg">{isAuthenticated ? 'Open dashboard' : 'Create a free account'}</LinkButton>
              {!isAuthenticated && <LinkButton to="/login" variant="secondary" size="lg">I have an account</LinkButton>}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-card p-5 sm:p-6" aria-label="Sample prompt comparison">
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold">Ticket summarizer</h3>
              <span className="text-sm text-muted">3 test cases</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[20rem] text-left text-sm">
                <thead>
                  <tr className="text-xs text-muted">
                    <th className="py-2 pr-3 font-normal" />
                    <th className="px-3 py-2 font-normal">v1</th>
                    <th className="px-3 py-2 font-normal">v2</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_ROWS.map((row) => (
                    <tr key={row.label} className="border-t border-line">
                      <td className="py-3 pr-3 text-muted">{row.label}</td>
                      <td className="px-3 py-3">{row.v1}</td>
                      <td className="px-3 py-3 font-semibold text-good">{row.v2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted">v2 changed one line: “Summarize in one sentence.” <span className="opacity-70">(Sample data)</span></p>
          </div>
        </section>

        <Section
          icon={GitBranch}
          title="Every edit becomes a version"
          text="Write your prompt, save it, and PromptLab keeps the full history. Go back to any earlier version in one click, and restoring never deletes anything."
        >
          <ol className="relative ml-2 space-y-5 border-l border-line pl-6">
            {VERSIONS.map((v) => (
              <li key={v.tag} className="relative text-sm">
                <span className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 ${v.current ? 'border-accent bg-accent' : 'border-muted bg-bg'}`} />
                <span className="font-semibold">{v.tag}</span> <span className="text-muted">{v.note}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section
          icon={FlaskConical}
          title="Test against real cases, not hunches"
          text="Build a dataset of questions and expected answers, run any prompt version against it, and get a similarity score, token counts and latency for every single case."
        >
          <div className="grid grid-cols-3 gap-3 text-center">
            {[['Score', 'per case'], ['Tokens', 'in and out'], ['Latency', 'in ms']].map(([a, b]) => (
              <div key={a} className="rounded-xl border border-line bg-card px-3 py-4">
                <p className="font-semibold">{a}</p>
                <p className="text-xs text-muted">{b}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">Rule-based checks, LLM-as-judge and cost tracking are on the roadmap.</p>
        </Section>

        <Section
          icon={BarChart3}
          title="Compare runs and see what improved"
          text="Put two completed runs side by side, see which version scored higher, and track your results across projects on a single dashboard."
        >
          <div className="space-y-4 rounded-2xl border border-line bg-card p-5">
            <Bar label="v1 average score" value={54} tone="bg-muted/60" />
            <Bar label="v2 average score" value={83} tone="bg-accent" />
            <p className="text-xs text-muted">Sample data</p>
          </div>
        </Section>

        <section className="my-8 rounded-2xl border border-line bg-card px-6 py-12 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Treat your prompts like software.</h2>
          <p className="mx-auto mt-3 max-w-md text-muted">Create a project, write a prompt, and run your first test in minutes.</p>
          <div className="mt-6 flex justify-center">
            <LinkButton to={isAuthenticated ? '/dashboard' : '/register'} size="lg">{isAuthenticated ? 'Open dashboard' : 'Create a free account'}</LinkButton>
          </div>
        </section>
      </main>

      <footer className="mx-auto mt-10 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-line px-5 py-8 text-sm text-muted sm:flex-row">
        <Logo className="!text-base" />
        <p>PromptLab – Prompt Engineering &amp; Testing Toolkit · Team 4, Anurag University</p>
      </footer>
    </div>
  )
}
