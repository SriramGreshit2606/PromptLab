// Every call here maps to a route that exists in the backend (app/routers/*).
// Collection routes keep their trailing slash on purpose: FastAPI would otherwise
// answer with a redirect, which can drop the Authorization header.
import api from './api'

const data = (response) => response.data

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then(data), // { full_name, email, password }
  login: (payload) => api.post('/auth/login', payload).then(data), //       { email, password } -> { access_token, token_type }
  me: () => api.get('/auth/me').then(data),
}

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary').then(data),
}

export const projectsApi = {
  list: () => api.get('/projects/').then(data),
  get: (id) => api.get(`/projects/${id}`).then(data),
  create: (payload) => api.post('/projects/', payload).then(data), // { name, description }
  update: (id, payload) => api.put(`/projects/${id}`, payload).then(data),
  remove: (id) => api.delete(`/projects/${id}`).then(data),
}

export const promptsApi = {
  list: (projectId) => api.get('/prompts/', { params: projectId ? { project_id: projectId } : {} }).then(data),
  get: (id) => api.get(`/prompts/${id}`).then(data),
  create: (payload) => api.post('/prompts/', payload).then(data), // { project_id, name, description }
  update: (id, payload) => api.put(`/prompts/${id}`, payload).then(data), // { name, description }
  // There is no DELETE /prompts/{id} in the backend.
}

export const versionsApi = {
  list: (promptId) => api.get(`/prompts/${promptId}/versions/`).then(data),
  get: (promptId, versionId) => api.get(`/prompts/${promptId}/versions/${versionId}`).then(data),
  create: (promptId, content) => api.post(`/prompts/${promptId}/versions/`, { content }).then(data),
  restore: (promptId, versionId) => api.post(`/prompts/${promptId}/versions/${versionId}/restore`).then(data),
}

export const datasetsApi = {
  list: (projectId) => api.get('/datasets/', { params: projectId ? { project_id: projectId } : {} }).then(data),
  get: (id) => api.get(`/datasets/${id}`).then(data),
  create: (payload) => api.post('/datasets/', payload).then(data), // { project_id, name, description }
  update: (id, payload) => api.put(`/datasets/${id}`, payload).then(data),
  remove: (id) => api.delete(`/datasets/${id}`).then(data),
}

export const casesApi = {
  list: (datasetId) => api.get(`/datasets/${datasetId}/cases/`).then(data),
  create: (datasetId, payload) => api.post(`/datasets/${datasetId}/cases/`, payload).then(data), // { input_text, expected_output }
  update: (datasetId, caseId, payload) => api.put(`/datasets/${datasetId}/cases/${caseId}`, payload).then(data),
  remove: (datasetId, caseId) => api.delete(`/datasets/${datasetId}/cases/${caseId}`).then(data),
}

export const aiApi = {
  // Single ad-hoc prompt. Model is fixed by the backend (GEMINI_MODEL).
  test: (prompt) => api.post('/ai/test', { prompt }, { timeout: 120000 }).then(data),
}

export const testRunsApi = {
  list: () => api.get('/test-runs/').then(data),
  get: (id) => api.get(`/test-runs/${id}`).then(data),
  results: (id) => api.get(`/test-runs/${id}/results`).then(data),
  // Synchronous: the request stays open until every case has been run.
  create: (payload) => api.post('/test-runs/', payload, { timeout: 15 * 60 * 1000 }).then(data), // { prompt_version_id, dataset_id }
}

export const comparisonsApi = {
  compare: (firstRunId, secondRunId) =>
    api.get('/comparisons/', { params: { first_run_id: firstRunId, second_run_id: secondRunId } }).then(data),
}
