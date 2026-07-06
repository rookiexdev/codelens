# CodeLens 🔍

> AI-powered code review platform. Connect your GitHub, GitLab, or Bitbucket — paste a PR link and get instant, structured feedback on bugs, security issues, and code quality.

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=flat&logo=turborepo&logoColor=white)](https://turbo.build/)

---

## What is CodeLens?

CodeLens is a full-stack platform that reviews pull requests using AI. Developers connect their Git provider (GitHub, GitLab, or Bitbucket), paste a PR URL into the dashboard, and receive a structured report covering:

- **Bugs** — critical and minor issues with file + line references
- **Security findings** — OWASP-tagged vulnerabilities
- **Code quality score** — 0–100 with breakdown
- **Improvement suggestions** — readability, performance, patterns
- **PR verdict** — approve / needs attention / changes required

It also includes a **profile + gamification** layer: user profiles with social links and tech stack, an activity log, contribution history, and an XP/badge system awarded via scheduled jobs.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Monorepo | Turborepo + Bun | Shared packages, parallel builds, caching |
| Backend | NestJS + TypeScript | REST API, modules, guards, pipes |
| Frontend | Next.js + React + TypeScript | Dashboard, auth pages, report UI |
| Database | MongoDB + Prisma | Users, reviews, OAuth tokens, badges |
| AI | Anthropic Claude API | Code analysis, structured feedback *(in progress)* |
| Auth | Passport.js + JWT | Local auth + OAuth (GitHub/GitLab/Bitbucket) |
| Scheduling | `@nestjs/schedule` | Badge-award cron jobs |
| Logging | Winston (`nest-winston`) | Structured request/app logs |

---

## Project Architecture

```
codelens/
├── apps/
│   ├── api/                  # NestJS backend (port 3001)
│   │   ├── src/
│   │   │   ├── auth/         # JWT, local strategy, guards
│   │   │   ├── oauth/        # GitHub / GitLab / Bitbucket OAuth strategies
│   │   │   ├── users/        # Profiles, social links, tech stack, status
│   │   │   ├── repos/        # Connected provider repositories
│   │   │   ├── badges/       # Badge catalog + award cron
│   │   │   ├── activity/     # Activity log, contribution history
│   │   │   ├── prisma/       # PrismaService (Mongo client)
│   │   │   ├── logger/       # Winston config
│   │   │   ├── common/       # Shared guards, decorators, filters
│   │   │   ├── config/       # Env validation
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma # MongoDB models (source of truth)
│   │   │   └── seeds/        # Idempotent badge-catalog seed
│   │   └── package.json
│   │
│   └── web/                  # Next.js frontend (port 3000)
│       ├── app/              # App-router pages
│       ├── components/       # UI components
│       ├── hooks/
│       ├── lib/
│       ├── public/
│       └── package.json
│
├── packages/
│   ├── shared-types/         # Shared TypeScript types
│   ├── ui/                   # Shared React components
│   └── eslint-config/        # Shared ESLint rules
│
├── deploy/                   # Deployment runbook + PM2 / Nginx configs
├── docker-compose.yml        # Local dev: single-node MongoDB replica set
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
                              (MongoDB)      (structured report)
                                                    │
                                            Optional: post comment
                                            back to GitHub PR
```

---

## Database

MongoDB, accessed through Prisma. The full, authoritative schema lives in
[`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma). Collections use ObjectId ids,
`@map`-ed snake_case field names, and `onDelete: Cascade` relations.

| Collection | Purpose |
|---|---|
| `users` | Accounts, profile, tech stack, status; soft-deleted via `deleted_at` |
| `oauth_connections` | Encrypted GitHub/GitLab/Bitbucket access + refresh tokens |
| `reviews` | PR review results — score, verdict, structured `feedback` JSON, share token |
| `user_social_links` | Ordered social/portfolio links per user |
| `activity_log` | Typed activity events (login, oauth, review, badge, …) |
| `user_contributions` | Per-day contribution counts (UTC-normalised) |
| `badges` / `user_badges` | Badge catalog and awarded badges |

> **Note:** MongoDB has no SQL migrations. Schema changes are applied with `prisma db push`,
> and the generated client (`prisma/generated`, gitignored) must be created with `prisma generate`.

---

## Getting Started

### Prerequisites

- Node.js 18+
- bun > 1.3
- Docker (for the local MongoDB replica set) **or** a MongoDB Atlas connection string

### 1. Clone and install

```bash
git clone https://github.com/your-username/codelens.git
cd codelens
bun install
```

### 2. Start the local database

Prisma requires MongoDB to run as a replica set (even single-node). The provided compose file
handles this:

```bash
docker compose up -d          # starts a one-node replica set on :27017
```

### 3. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
# create apps/web/.env.local with the API URL (see below)
```

**`apps/api/.env`**
```env
NODE_ENV=development
PORT=3001

# Local replica set from docker-compose (or your Atlas SRV string)
DATABASE_URL='mongodb://localhost:27017/codelens?replicaSet=rs0&directConnection=true'

JWT_SECRET=your-super-secret-jwt-key-min-32-chars   # must be >= 32 chars
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=your-32-char-encryption-key-here     # encrypts stored OAuth tokens

WEB_ORIGIN=http://localhost:3000                    # used by CORS
FRONTEND_URL=http://localhost:3000                  # used for OAuth redirects

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3001/oauth/github/callback

# GitLab OAuth
GITLAB_CLIENT_ID=your-gitlab-client-id
GITLAB_CLIENT_SECRET=your-gitlab-client-secret
GITLAB_CALLBACK_URL=http://localhost:3001/oauth/gitlab/callback

# Bitbucket OAuth
BITBUCKET_CLIENT_ID=your-bitbucket-client-id
BITBUCKET_CLIENT_SECRET=your-bitbucket-client-secret
BITBUCKET_CALLBACK_URL=http://localhost:3001/oauth/bitbucket/callback
```

**`apps/web/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Sync schema, seed, run

```bash
cd apps/api
bun run prisma:generate      # generate the Prisma client
bun run prisma:push          # sync schema to MongoDB
bun run db:seed              # seed the badge catalog (idempotent)
cd ../..

bun dev                      # runs api + web in parallel (Turborepo)
```

### 5. Open the app

| Service | URL |
|---|---|
| Web dashboard | http://localhost:3000 |
| API | http://localhost:3001 |

---

## Development Commands

```bash
bun dev            # run all apps in parallel (Turborepo)
bun build          # build all apps
bun test           # run tests across all packages
bun lint           # lint everything

# Prisma (run inside apps/api)
bun run prisma:generate   # regenerate the client
bun run prisma:push       # apply schema changes to MongoDB
bun run prisma:studio     # browse data
bun run db:seed           # seed the badge catalog
```

---

## OAuth Setup

To connect Git providers, register OAuth apps and set their callback URLs to match
`*_CALLBACK_URL` in your `.env`:

**GitHub**
1. GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App
2. Homepage URL: `http://localhost:3000`
3. Callback URL: `http://localhost:3001/oauth/github/callback`
4. Copy Client ID + Secret into `.env`

**GitLab**
1. GitLab → User Settings → Applications
2. Redirect URI: `http://localhost:3001/oauth/gitlab/callback`
3. Scopes: `read_api`, `read_repository`

**Bitbucket**
1. Bitbucket → Personal Settings → OAuth → Add consumer
2. Callback URL: `http://localhost:3001/oauth/bitbucket/callback`
3. Permissions: `Repositories: Read`, `Pull requests: Read`

---

## Deployment

Production runs on a single Ubuntu server: **MongoDB Atlas** (managed replica set),
the two Node apps under **PM2**, behind **Nginx + Certbot** (HTTPS).

See the full step-by-step runbook in [`deploy/DEPLOYMENT.md`](deploy/DEPLOYMENT.md).
PM2 and Nginx configs live in [`deploy/ecosystem.config.js`](deploy/ecosystem.config.js) and
[`deploy/nginx.conf`](deploy/nginx.conf).

---

## Roadmap

High-level milestones:
- [x] Project setup & Turborepo structure
- [x] Auth — JWT + local login/signup
- [x] OAuth — GitHub / GitLab / Bitbucket
- [x] Profiles, activity log & badge system
- [ ] Core review — manual code paste + Claude API
- [ ] PR URL flow — fetch diff from Git providers
- [ ] Report UI — dashboard, findings, score
- [ ] Export — PDF reports + share links
- [ ] Post-back — comment on GitHub/GitLab PR

---

## Contributing

This project is currently in active development. Feel free to open issues or PRs.

---

## License

MIT © CodeLens
