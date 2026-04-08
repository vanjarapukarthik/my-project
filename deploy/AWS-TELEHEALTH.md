# Telehealth platform — AWS deployment (single EC2 + Nginx)

This matches the **approved pattern** from your guide: one EC2, **Nginx** on 80/443, **Node bound to `127.0.0.1`**, **no public port 5000**.

## Architecture (this project)

| Public | Internal |
|--------|----------|
| Browser → `http://EC2/` | Nginx serves `frontend/dist` |
| Browser → `/api/*`, `/health`, `/socket.io/*` | Proxied to `127.0.0.1:5000` |

## Prerequisites

- Ubuntu 22.04/24.04 EC2, **Security Group**: `22` (your IP), `80`, `443` — **not** `5000`.
- MongoDB Atlas URI (or other Mongo reachable from EC2).

## 1) EC2 — install stack

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git build-essential
sudo npm install -g pm2
```

## 2) Copy project to EC2

Example (from your PC, adjust paths):

```bash
scp -i your-key.pem -r C:\path\to\telehealth_platform_full_production ubuntu@EC2_IP:/home/ubuntu/
```

## 3) Backend env

```bash
cd /home/ubuntu/telehealth_platform_full_production/backend
cp ../deploy/env.backend.ec2.example .env
nano .env
```

Set at least: `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN` (must equal how users open the app, e.g. `http://EC2_PUBLIC_IP`).

## 4) PM2 (backend on localhost only)

`deploy/ecosystem.config.cjs` sets `HOST=127.0.0.1`. From repo root on EC2:

```bash
cd /home/ubuntu/telehealth_platform_full_production
npm ci --omit=dev --prefix backend
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
```

Verify (from EC2):

```bash
curl -s http://127.0.0.1:5000/health
```

## 5) Frontend build (on your PC or on EC2)

Use **path-only** env (no IPs in the bundle):

```bash
cd frontend
copy .env.production.example .env.production
# Linux/Mac: cp .env.production.example .env.production
npm ci
npm run build
```

Upload `frontend/dist/*` to EC2 if you built locally, or run the same commands on EC2 after `npm ci` in `frontend/`.

Ensure Nginx `root` points at the folder that contains `index.html` (usually `frontend/dist`).

## 6) Nginx

Edit `root` and `server_name` in `deploy/nginx-telehealth.conf` if your paths differ, then:

```bash
sudo cp /home/ubuntu/telehealth_platform_full_production/deploy/nginx-telehealth.conf /etc/nginx/sites-available/telehealth
sudo ln -sf /etc/nginx/sites-available/telehealth /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 7) Verify

- Browser: `http://EC2_PUBLIC_IP/` — UI loads.
- `http://EC2_PUBLIC_IP/health` — JSON from API.
- Login / API calls — same origin, no CORS issues if `CORS_ORIGIN` matches the page origin.

## HTTPS (recommended later)

Use a domain + Let’s Encrypt (`certbot`) and change Nginx to `listen 443 ssl`.

## Differences from the RealEstate guide

- One **Express** app on **5000** (not engines 7001–7007).
- **Socket.IO** at `/socket.io` (WebRTC signaling), proxied in Nginx.
- Frontend env: `VITE_API_URL=/api`, `VITE_WS_URL` empty (same host as the page).
