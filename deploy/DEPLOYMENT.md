# CodeLens — Deployment Runbook (Ubuntu + MongoDB Atlas + Nginx/Certbot + PM2)

Stack: Turborepo monorepo, Bun. `apps/api` = NestJS (port 3001), `apps/web` = Next.js (port 3000).
DB = **MongoDB** via Prisma (`db push`, no SQL migrations).

Assumes: `example.com` for the web app and `api.example.com` for the API. Replace with your domains.

---

## 0. One-time server prep

```bash
# You already have node + bun. Add the rest:
sudo apt update
sudo apt install -y git nginx
sudo snap install --classic certbot && sudo ln -sf /snap/bin/certbot /usr/local/bin/certbot
bun install -g pm2        # or: npm install -g pm2

# DNS: create A records
#   example.com       -> <server public IP>
#   api.example.com   -> <server public IP>
```

## 1. MongoDB Atlas

1. Create a cluster (free M0 is fine to start). It is a replica set by default — required by Prisma.
2. **Network Access** → add your server's public IP (or `0.0.0.0/0` only if you must).
3. **Database Access** → create a user with a strong password.
4. Copy the SRV connection string and append the DB name + params, e.g.:
   ```
   mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/codelens?retryWrites=true&w=majority
   ```
   This becomes `DATABASE_URL`.

## 2. Get the code

```bash
git clone <repo-url> codelens && cd codelens
git checkout feature/github-bitbucket-gitlab-auth   # or your release branch
bun install                                          # installs all workspaces
```

## 3. Environment files

### `apps/api/.env`  (loaded by @nestjs/config from the api cwd)
```env
NODE_ENV=production
PORT=3001

DATABASE_URL='mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/codelens?retryWrites=true&w=majority'

JWT_SECRET='<random string, at least 32 chars>'   # validation rejects shorter
JWT_EXPIRES_IN='7d'
ENCRYPTION_KEY='<exactly 32 chars>'               # encrypts stored OAuth tokens — keep STABLE

# Public URLs — these drive CORS + OAuth redirects
WEB_ORIGIN=https://example.com                    # used by CORS (credentials:true)
FRONTEND_URL=https://example.com                  # used for post-login redirects

# OAuth — callback URLs must be the PUBLIC api URLs
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=https://api.example.com/oauth/github/callback

GITLAB_CLIENT_ID=...
GITLAB_CLIENT_SECRET=...
GITLAB_CALLBACK_URL=https://api.example.com/oauth/gitlab/callback

BITBUCKET_CLIENT_ID=...
BITBUCKET_CLIENT_SECRET=...
BITBUCKET_CALLBACK_URL=https://api.example.com/oauth/bitbucket/callback
```
Generate secrets: `openssl rand -hex 24` (JWT), `openssl rand -hex 16` (32-char ENCRYPTION_KEY).

### `apps/web/.env.production`  (baked at BUILD time — must exist BEFORE `bun run build`)
```env
NEXT_PUBLIC_API_URL=https://api.example.com
```

## 4. Prisma (client + schema sync)

The Prisma client is gitignored, so it must be generated on the server. MongoDB has no
migrations — `db push` syncs the schema.

```bash
cd apps/api
bun run prisma:generate      # generates prisma/generated/client
bun run prisma:push          # syncs schema to Atlas
bun run db:seed              # idempotent badge catalog seed
cd ../..
```

## 5. Build

```bash
bun run build                # turbo builds api (dist/) and web (.next/)
```

## 6. Start with PM2

```bash
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup                  # run the command it prints (enables start-on-boot)
pm2 status
pm2 logs codelens-api        # sanity check
```

## 7. Nginx + HTTPS

```bash
# edit deploy/nginx.conf: replace example.com / api.example.com with your domains
sudo cp deploy/nginx.conf /etc/nginx/sites-available/codelens
sudo ln -s /etc/nginx/sites-available/codelens /etc/nginx/sites-enabled/codelens
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d example.com -d api.example.com   # adds TLS + http->https redirect
```

## 8. OAuth provider apps

In GitHub / GitLab / Bitbucket developer settings, set each OAuth app's callback URL to the
matching `https://api.example.com/oauth/<provider>/callback`. Mismatches = login fails.

## 9. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'   # 80 + 443
sudo ufw enable
# Do NOT open 3000/3001 — they're only reached via the Nginx proxy on localhost.
```

## 10. Verify

```bash
curl -I https://api.example.com/            # API reachable over TLS
# open https://example.com in a browser, then test an OAuth login end-to-end
```

---

## Redeploy / update

```bash
cd codelens
git pull
bun install
cd apps/api && bun run prisma:generate && bun run prisma:push && cd ../..   # push only if schema changed
bun run build
pm2 reload deploy/ecosystem.config.js
```

## Gotchas (specific to this repo)

- **`start:prod` path**: the compiled entry is `dist/src/main.js` (prisma seeds pull the TS root
  up a level). The script was fixed to `node dist/src/main`; PM2 points at `dist/src/main.js`.
- **Standalone MongoDB won't work** — Prisma requires a replica set. Atlas satisfies this.
- **`NEXT_PUBLIC_API_URL` is compile-time** — if you change it, you must rebuild the web app.
- **`ENCRYPTION_KEY` must stay stable** — it encrypts stored OAuth tokens; rotating it invalidates
  existing connections.
- **Stale docs**: the root `README.md` and `docker-compose.yml` reference PostgreSQL, Railway/Vercel,
  and `Dockerfile`s that don't exist. Ignore them for this deploy.
```
