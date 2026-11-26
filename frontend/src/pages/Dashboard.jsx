import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { FileText, FlaskConical, FolderKanban, Gauge, Plus } from 'lucide-react'
import { dashboardApi, projectsApi, promptsApi, testRunsApi } from '../services/endpoints'
import { useAsync } from '../hooks/useAsync'
import { Card, EmptyState, ErrorBanner, LinkButton, PageHeader, PageLoader, StatCard, StatusBadge } from '../components/ui'
import { formatDate, formatMs, formatNumber, formatScore } from '../utils/format'
import { useAuth } from '../context/AuthContext'

const AXIS = { fill: '#91A99D', fontSize: 12 }
const TOOLTIP = {
  contentStyle: { background: '#192723', border: '1px solid #2B3B35', borderRadius: 12, color: '#E8F0EA' },
  labelStyle: { color: '#91A99D' },
  cursor: { fill: 'rgba(169,149,255,0.08)' },
}

function ChartCard({ title, subtitle, children }) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="mb-4 text-xs text-muted">{subtitle}</p>
      <div className="h-60">{children}</div>
    </Card>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useAsync(async () => {
    const [summary, projects, runs, prompts] = await Promise.all([
      dashboardApi.summary(), projectsApi.list(), testRunsApi.list(), promptsApi.list(),
    ])
    return { summary, projects, runs, prompts }
  }, [])

  if (loading) return <PageLoader />
  if (error) return <ErrorBanner message={error} onRetry={reload} />

  const { summary, projects, runs, prompts } = data
  const promptName = Object.fromEntries(prompts.map((p) => [p.id, p.name]))

  // Runs come newest-first. The backend does not return run dates, so charts use run order.
  const scoreSeries = runs
    .filter((run) => run.status === 'completed')
    .slice(0, 10)
    .reverse()
    .map((run) => ({ name: `#${run.id}`, score: Number(run.average_score.toFixed(1)) }))

  const statusSeries = ['completed', 'running', 'failed', 'pending'].map((status) => ({
    name: status[0].toUpperCase() + status.slice(1),
    runs: runs.filter((run) => run.status === status).length,
  }))

  const firstName = user?.full_name?.split(' ')[0]

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome, ${firstName}` : 'Dashboard'}
        description="A snapshot of your projects, prompts and test runs."
        actions={<LinkButton to="/projects?new=1" icon={Plus}>New project</LinkButton>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total projects" value={formatNumber(summary.total_projects)} icon={FolderKanban} />
        <StatCard label="Total prompts" value={formatNumber(summary.total_prompts)} icon={FileText} />
        <StatCard label="Total test runs" value={formatNumber(summary.total_test_runs)} icon={FlaskConical} />
        <StatCard label="Average score" value={formatScore(summary.average_score)} icon={Gauge} hint="Completed runs, similarity to expected answers" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Average score by recent run" subtitle="Last 10 completed runs, oldest to newest">
          {scoreSeries.length === 0 ? (
            <EmptyState className="h-full" title="No completed runs yet" description="Scores appear here after your first test run." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreSeries} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="#2B3B35" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={AXIS} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP} formatter={(value) => [`${value}%`, 'Average score']} />
                <Line type="monotone" dataKey="score" stroke="#A995FF" strokeWidth={2.5} dot={{ r: 4, fill: '#A995FF' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Test run activity" subtitle="Number of runs by status">
          {runs.length === 0 ? (
            <EmptyState className="h-full" title="No test runs yet" description="Run a prompt against a dataset to see activity." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusSeries} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="#2B3B35" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP} />
                <Bar dataKey="runs" fill="#4BCB80" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent projects</h2>
            <Link to="/projects" className="text-sm text-accent hover:underline">View all</Link>
          </div>
          {projects.length === 0 ? (
            <EmptyState icon={FolderKanban} title="No projects yet" description="Projects keep your prompts and datasets organised." action={<LinkButton to="/projects?new=1" size="sm" icon={Plus}>Create project</LinkButton>} />
          ) : (
            <ul className="divide-y divide-line">
              {projects.slice(0, 5).map((project) => (
                <li key={project.id}>
                  <Link to={`/projects/${project.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-accent">
                    <span className="truncate font-medium">{project.name}</span>
                    <span className="shrink-0 text-xs text-muted">{formatDate(project.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Recent test runs</h2>
          {runs.length === 0 ? (
            <EmptyState icon={FlaskConical} title="No test runs yet" description="Your latest runs will be listed here with their scores." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead className="text-xs text-muted">
                  <tr>
                    <th className="pb-2 font-normal">Run</th>
                    <th className="pb-2 font-normal">Prompt</th>
                    <th className="pb-2 font-normal">Status</th>
                    <th className="pb-2 text-right font-normal">Score</th>
                    <th className="pb-2 text-right font-normal">Tokens</th>
                    <th className="pb-2 text-right font-normal">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {runs.slice(0, 6).map((run) => (
                    <tr key={run.id}>
                      <td className="py-3"><Link to={`/runs/${run.id}`} className="text-accent hover:underline">#{run.id}</Link></td>
                      <td className="max-w-[10rem] truncate py-3 font-medium">{promptName[run.prompt_id] || `Prompt ${run.prompt_id}`}</td>
                      <td className="py-3"><StatusBadge status={run.status} /></td>
                      <td className="py-3 text-right">{run.status === 'completed' ? formatScore(run.average_score) : '—'}</td>
                      <td className="py-3 text-right">{formatNumber(run.total_tokens)}</td>
                      <td className="py-3 text-right">{formatMs(run.total_latency_ms)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
