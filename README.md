# CodeLens 🔍

> AI-powered code review platform. Connect your GitHub, GitLab, or Bitbucket — paste a PR link and get instant, structured feedback on bugs, security issues, and code quality.

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=flat&logo=turborepo&logoColor=white)](https://turbo.build/)

---

## What is CodeLens?

CodeLens is a full-stack SaaS platform that reviews pull requests using AI. Developers connect their Git provider (GitHub, GitLab, or Bitbucket), paste a PR URL into the dashboard, and receive a structured report covering:

- **Bugs** — critical and minor issues with file + line references
- **Security findings** — OWASP-tagged vulnerabilities
- **Code quality score** — 0–100 with breakdown
- **Improvement suggestions** — readability, performance, patterns
- **PR verdict** — approve / needs attention / changes required

Reports can be viewed on the dashboard, exported as PDF, or posted back as a comment directly on the PR.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Monorepo | Turborepo | Shared packages, parallel builds, caching |
| Backend | NestJS + TypeScript | REST API, modules, guards, pipes |
| Frontend | Next.js + TypeScript | Dashboard, auth pages, report UI |
| Database | PostgreSQL + TypeORM | Users, reviews, OAuth tokens |
| AI | Anthropic Claude API | Code analysis, structured feedback |
| Auth | Passport.js + JWT | Local auth + OAuth (GitHub/GitLab/Bitbucket) |
| Containerisation | Docker + Docker Compose | Local dev + production deployment |
| Deployment | Railway (API) + Vercel (web) | CI/CD, managed infra |

---

## Project Architecture

```
codelens/
├── apps/
│   ├── api/                  # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/         # JWT, OAuth strategies, guards
│   │   │   ├── reviews/      # PR review logic, report builder
│   │   │   ├── ai/           # Claude API integration, prompt builder
│   │   │   ├── git/          # GitHub / GitLab / Bitbucket API clients
│   │   │   ├── users/        # User entity, profile
│   │   │   └── reports/      # PDF generation, share links
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── web/                  # Next.js frontend
│       ├── app/
│       │   ├── (auth)/       # Login, signup pages
│       │   ├── dashboard/    # Main review dashboard
│       │   ├── review/[id]/  # Individual report view
│       │   └── settings/     # Git provider connections
│       ├── components/
│       │   ├── editor/       # Code / diff input
│       │   ├── report/       # Report cards, findings list
│       │   └── ui/           # Shared UI primitives
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   ├── shared-types/         # Shared TypeScript interfaces (Review, User, Finding)
│   ├── ui/                   # Shared React component library
│   └── eslint-config/        # Shared ESLint rules
│
├── docker-compose.yml        # Local dev: API + Web + PostgreSQL
├── docker-compose.prod.yml   # Production compose
├── turbo.json                # Turborepo pipeline config
└── package.json              # Root workspace
```

---

## Data Flow

```
User pastes PR URL
      │
      ▼
Next.js dashboard  ──POST /reviews──▶  NestJS API
                                            │
                                    ┌───────┴────────┐
                                    │                │
                               Auth Guard      PR Service
                               (JWT verify)   (parse URL)
                                                    │
                                            GitHub/GitLab API
                                            (fetch diff using
                                             stored OAuth token)
                                                    │
                                              AI Service
                                         (build prompt → Claude API)
                                                    │
                                           Parse JSON response
                                                    │
                                    ┌───────┴────────┐
                                    │                │
                               Save to DB     Return to client
                             (PostgreSQL)   (structured report)
                                                    │
                                            Optional: post comment
                                            back to GitHub PR
```

---

## Database Schema

### users
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| email | VARCHAR | Unique |
| password_hash | VARCHAR | bcrypt, nullable (OAuth users) |
| created_at | TIMESTAMP | |

### oauth_connections
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK → users |
| provider | ENUM | github / gitlab / bitbucket |
| access_token | VARCHAR | AES-256 encrypted |
| refresh_token | VARCHAR | AES-256 encrypted |
| scope | VARCHAR | Granted OAuth scopes |

### reviews
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK → users |
| provider | ENUM | github / gitlab / bitbucket / manual |
| repo | VARCHAR | e.g. acme-org/backend-api |
| pr_number | INT | Nullable (manual paste) |
| pr_title | VARCHAR | |
| language | VARCHAR | Primary language detected |
| score | INT | 0–100 quality score |
| verdict | ENUM | approve / needs_attention / changes_required |
| feedback | JSONB | Full structured AI response |
| share_token | VARCHAR | For public share links |
| created_at | TIMESTAMP | |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker + Docker Compose
- bun >1.3

### 1. Clone and install

```bash
git clone https://github.com/your-username/codelens.git
cd codelens
bun install
```

### 2. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

**`apps/api/.env`**
```env
# App
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://codelens:codelens@localhost:5432/codelens

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Encryption (for OAuth tokens)
ENCRYPTION_KEY=your-32-char-encryption-key-here

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback

# GitLab OAuth
GITLAB_CLIENT_ID=your-gitlab-client-id
GITLAB_CLIENT_SECRET=your-gitlab-client-secret

# Bitbucket OAuth
BITBUCKET_CLIENT_ID=your-bitbucket-client-id
BITBUCKET_CLIENT_SECRET=your-bitbucket-client-secret
```

**`apps/web/.env`**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Start with Docker

```bash
# Start everything (API + Web + PostgreSQL)
docker-compose up

# Or run just the database, develop locally
docker-compose up postgres
bun dev
```

### 4. Open the app

| Service | URL |
|---|---|
| Web dashboard | http://localhost:3000 |
| API | http://localhost:3001 |
| Swagger docs | http://localhost:3001/api/docs |

---

## Development Commands

```bash
# Run all apps in parallel (Turborepo)
bun dev

# Build all apps
bun build

# Run tests across all packages
bun test

# Lint everything
bun lint

# Generate TypeORM migration
bun --filter api migration:generate -- src/migrations/MigrationName

# Run migrations
bun --filter api migration:run
```

---

## OAuth Setup

To connect Git providers, you need to register OAuth Apps:

**GitHub**
1. Go to GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App
2. Homepage URL: `http://localhost:3000`
3. Callback URL: `http://localhost:3001/auth/github/callback`
4. Copy Client ID + Secret into `.env`

**GitLab**
1. Go to GitLab → User Settings → Applications
2. Redirect URI: `http://localhost:3001/auth/gitlab/callback`
3. Scopes: `read_api`, `read_repository`

**Bitbucket**
1. Go to Bitbucket → Personal Settings → OAuth → Add consumer
2. Callback URL: `http://localhost:3001/auth/bitbucket/callback`
3. Permissions: `Repositories: Read`, `Pull requests: Read`

---

## Deployment

### Backend — Railway

```bash
# Connect repo to Railway, set environment variables in dashboard
# Railway auto-detects Dockerfile in apps/api
railway up
```

### Frontend — Vercel

```bash
# Connect repo to Vercel, set NEXT_PUBLIC_API_URL to your Railway URL
vercel --prod
```

### Production Docker

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Roadmap

See the full project roadmap in [Notion](https://gopalsasmal.notion.site/3476e1c0cca4808d80d3c4a69b119afa?v=3476e1c0cca481559eeb000cdee43a8b) *(link your Notion page here)*.

High-level milestones:
- [x] Project setup & Turborepo structure
- [ ] Auth — JWT + local login/signup
- [ ] OAuth — GitHub / GitLab / Bitbucket
- [ ] Core review — manual code paste + Claude API
- [ ] PR URL flow — fetch diff from Git providers
- [ ] Report UI — dashboard, findings, score
- [ ] Export — PDF reports + share links
- [ ] Post-back — comment on GitHub/GitLab PR
- [ ] Deploy — Railway + Vercel

---

## Contributing

This project is currently in active development. Feel free to open issues or PRs.

---

## License

MIT © CodeLens