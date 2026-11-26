# PromptLab Frontend

React + Vite + Tailwind CSS frontend for **PromptLab – Prompt Engineering & Testing Toolkit** (Team 4, Anurag University).
It talks to the FastAPI backend in `PromptLab-main` (PostgreSQL + Google Gemini + JWT).

## Run it

**1. Backend** (from the `PromptLab-main` folder, with its own `.env` containing `DATABASE_URL`, `SECRET_KEY`, `GEMINI_API_KEY`):

```bash
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Swagger docs: http://localhost:8000/docs

**2. Frontend** (from this folder):

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Environment (`.env`)

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Leave **empty** in development. API calls go to `/api/v1/...` and Vite proxies them to the backend, so no CORS setup is needed. For a deployed build, set it to the backend origin. |
| `VITE_PROXY_TARGET` | Backend address used by the dev proxy. Default `http://localhost:8000`. |

No Gemini key or database credentials are ever used by the frontend. Gemini is called only by the backend.

## Backend facts this frontend is built around

All verified from the backend source (`app/routers`, `app/schemas`):

- Base path `/api/v1`. Login is **JSON** `{ email, password }` and returns `{ access_token, token_type }`. Protected routes need `Authorization: Bearer <token>`.
- Tokens last **30 minutes** and there is no refresh endpoint. The app logs out automatically when the token expires or any call returns 401.
- Passwords must be 8–128 characters (also enforced on login). Registration takes `full_name`, `email`, `password`; there is no confirm-password field, so that check is browser-side only.
- Collection routes end with `/` (`/projects/`, `/prompts/`, …). The frontend keeps the slash so FastAPI does not redirect.
- `POST /test-runs/` is **synchronous**: it returns only after every case has run. The client allows up to 15 minutes for it.
- Scores are 0–100 **text similarity** (`difflib.SequenceMatcher`) against the expected answer. The backend has no pass/fail, so any colour bands in the UI are display-only.
- Run and result records have no created date for runs, no cost, no model name and no per-case pass/fail.

## Endpoint map

| Frontend area | Backend endpoints |
|---|---|
| Login / Register / session | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` |
| Dashboard | `GET /dashboard/summary`, `GET /projects/`, `GET /test-runs/`, `GET /prompts/` |
| Projects | `GET/POST /projects/`, `GET/PUT/DELETE /projects/{id}` |
| Prompts | `GET/POST /prompts/` (`?project_id=`), `GET/PUT /prompts/{id}` (no delete) |
| Versions | `GET/POST /prompts/{id}/versions/`, `GET .../versions/{vid}`, `POST .../versions/{vid}/restore` |
| Datasets | `GET/POST /datasets/`, `GET/PUT/DELETE /datasets/{id}` |
| Test cases | `GET/POST /datasets/{id}/cases/`, `PUT/DELETE .../cases/{cid}` |
| Playground | `POST /test-runs/`, `POST /ai/test` |
| Results | `GET /test-runs/{id}`, `GET /test-runs/{id}/results` |
| Comparison | `GET /comparisons/?first_run_id=&second_run_id=` |

All of these are already wrapped in `src/services/endpoints.js`.

## BRD features the backend does not support yet

Roles and permissions, review/approval workflow and prompt status lifecycle, prompt tags, system/user message split, model parameters (temperature, max tokens), variable substitution, change notes and version authors, CSV/JSON dataset import, rule-based and LLM-as-judge evaluation, multi-model runs, cost tracking, regression suites, prompt library, audit trail, exports, API-key management. The UI does not pretend any of these exist.

## Project structure

```
src/
  components/   reusable UI (ui.jsx primitives, modals, route guard)
  context/      AuthContext (JWT, expiry), ToastContext
  hooks/        useAsync
  layouts/      AppLayout (sidebar, top bar, user menu)
  pages/        Landing, Login, Register, Dashboard, Projects, ProjectDetail
  services/     api.js (Axios instance), endpoints.js (all backend calls)
  utils/        format.js, errors.js
```
