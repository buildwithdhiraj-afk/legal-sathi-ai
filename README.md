# LegalSathi AI

## Know Your Rights Before It's Too Late.
An AI-powered multilingual Legal Information and Guidance Platform built with Next.js, FastAPI, PostgreSQL, and AI.

> **Disclaimer**: This platform provides legal information, not legal advice. Always consult a licensed advocate for official legal representation.

---

## Architecture & Tech Stack
- **Frontend**: Next.js 14, React 18, Tailwind CSS, TypeScript (Deployed on **GitHub Pages** as a static export)
- **Backend**: FastAPI, Python 3.12, Gunicorn, Uvicorn, SQLAlchemy 2.0 (Deployed on **Render Free**)
- **Database**: PostgreSQL (Hosted on **Supabase Free** / **Neon Free** or SQLite for local dev)
- **AI Engine**: Gemini API, Sentence Transformers, RAG Pipeline
- **Authentication**: JWT Auth, Argon2/Bcrypt, Guest Chat Limit (5 chats max)

---

## Production Deployment (100% Free Stack)

### Step 1: Database Setup (Supabase / Neon)
1. Create a free account at [Supabase](https://supabase.com) or [Neon](https://neon.tech).
2. Create a new PostgreSQL database.
3. Copy your database connection string: `postgresql://user:password@ep-xyz.neon.tech/legalsathi_db`.

### Step 2: Backend Deployment (Render Free)
1. Go to [Render Dashboard](https://dashboard.render.com) and click **New +** -> **Blueprint**.
2. Connect the GitHub repository: `buildwithdhiraj-afk/legal-sathi-ai`.
3. Set the Environment Variables:
   - `DATABASE_URL`: Your Supabase/Neon PostgreSQL URL (or default SQLite)
   - `SECRET_KEY`: Random 32+ character string
   - `GEMINI_API_KEY`: Your Google Gemini API Key
   - `ALLOWED_ORIGINS`: `https://<your-user>.github.io`
   - `ALLOWED_ORIGIN_REGEX`: `https://([a-z0-9-]+\.)?(vercel\.app|github\.io)` (Pages + preview deploys)
4. Deploy the backend service. Your backend API URL will be `https://<your-render-backend>.onrender.com`.

### Step 3: Frontend Deployment (GitHub Pages - static export)
The frontend is a static export (`output: 'export'`) published from `frontend/out` to `https://<your-user>.github.io/legal-sathi-ai/`.
1. Push the repo to GitHub, then open **Settings -> Pages**.
2. Set **Source** to **GitHub Actions**.
3. Add a repository variable (**Settings -> Secrets and variables -> Actions -> Variables**):
   - `NEXT_PUBLIC_API_URL`: `https://<your-render-backend>.onrender.com`
4. The included workflow (`.github/workflows/deploy-pages.yml`) builds the static site and publishes it to Pages on every push to `main`.

---

## Local Development Setup

```bash
# Clone the repository
git clone https://github.com/buildwithdhiraj-afk/legal-sathi-ai.git
cd legal-sathi-ai

# Option A: Start Backend & Frontend via Batch Scripts (Windows)
start-backend.bat
start-frontend.bat

# Option B: Docker Compose
docker-compose up --build
```

---

## API Endpoints
- **Frontend App**: `http://localhost:3000`
- **Backend API Docs**: `http://localhost:8000/docs` (development only; disabled in production)
- **Health Check**: `http://localhost:8000/health`
- **System Status**: `http://localhost:8000/status`

---

## 🚀 Development Roadmap & Upgrades

This project is currently being upgraded for production readiness:

- [x] **Legal**: Implement Mandatory Citations in RAG pipeline.
- [x] **Legal**: Add Legal Disclaimer UI component.
- [x] **Security**: Implement PII Redaction Pipeline (see `.env.example`).
- [x] **Tech**: Implement Hybrid Search (Vector + BM25) [Dependencies Added, Implementation Done].
- [x] **Tech**: Setup RAG Evaluation (RAGAS integration) [Implemented dataset and evaluation scaffold].
- [x] **UX**: Implement Clickable Source Highlighting [Backend citation parsing + Frontend Chip UI].
- [x] **Security**: Role-Based Access Control (RBAC) [JWT Bearer Auth, Admin/User roles, Protected routes].
- [x] **Security**: Audit Logging [Detailed logging of queries, PII redaction, and admin actions].

