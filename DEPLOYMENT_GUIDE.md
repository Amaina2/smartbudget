# SmartBudget Deployment Guide

This document separates:

- **Done in codebase** (already implemented)
- **Manual external steps** (you must do on hosting provider)

## Done in codebase

- Security middleware:
  - `helmet` enabled
  - API/global rate limiting enabled
  - Auth route-specific rate limiting enabled
- Production-ready env template:
  - `server/.env.example` updated with production defaults and notes
- Deployment templates:
  - `docker-compose.yml` (local/dev)
  - `docker-compose.prod.yml` (production stack)
  - `deploy/nginx/nginx.conf` (TLS reverse-proxy + SPA routing)
- Secret safety:
  - root `.gitignore` ignores `.env` files

## Manual external steps (required)

## 1) Rotate database password

Run in PostgreSQL:

```sql
ALTER USER postgres WITH PASSWORD '<new-strong-password>';
```

Update production secret values accordingly.

## 2) Generate JWT secret

PowerShell command:

```powershell
$bytes = New-Object byte[] 64
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Use output as `JWT_SECRET`.

## 3) Create `.env` for production

Create a secure env file (not committed):

```env
NODE_ENV=production
PORT=5000
DB_NAME=smartbudget
DB_USER=postgres
DB_PASSWORD=<strong-password>
JWT_SECRET=<generated-secret>
CLIENT_ORIGIN=https://your-frontend-domain.com
```

Add M-Pesa secrets if needed.

## 4) Build frontend before production compose

From `client/`:

```bash
npm install
npm run build
```

This generates `client/dist` used by Nginx.

## 5) Configure domain + TLS

- Point DNS `A` record to server IP
- Issue certificate with certbot
- Mount cert paths referenced in `deploy/nginx/nginx.conf`

## 6) Run production stack

From project root:

```bash
docker compose -f docker-compose.prod.yml --env-file server/.env up -d --build
```

## 7) Enable backups + monitoring

- Schedule nightly DB backups
- Keep off-server backup copy
- Add uptime checks for:
  - `https://your-domain.com/`
  - `https://your-domain.com/api/health`

## 8) Final test checklist

- Login/register/logout works over HTTPS
- Transactions/budgets/reports/recurring all working
- M-Pesa callback reachable (if enabled)
- Dark mode + dashboard recommendations intact
