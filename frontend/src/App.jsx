import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Prompts from './pages/Prompts'
import PromptDetail from './pages/PromptDetail'
import Datasets from './pages/Datasets'
import DatasetDetail from './pages/DatasetDetail'
import Playground from './pages/Playground'
import Runs from './pages/Runs'
import RunDetail from './pages/RunDetail'
import Comparison from './pages/Comparison'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:projectId" element={<ProjectDetail />} />
        <Route path="/prompts" element={<Prompts />} />
        <Route path="/prompts/:promptId" element={<PromptDetail />} />
        <Route path="/datasets" element={<Datasets />} />
        <Route path="/datasets/:datasetId" element={<DatasetDetail />} />
        <Route path="/playground" element={<Playground />} />
        <Route path="/runs" element={<Runs />} />
        <Route path="/runs/:runId" element={<RunDetail />} />
        <Route path="/comparison" element={<Comparison />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
