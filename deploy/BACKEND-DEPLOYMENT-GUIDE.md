# Node.js backend — EC2 Ubuntu deployment guide

This guide matches **this repository**: `telehealth_platform_full_production/backend` (Express + Socket.IO, entry `server.js`).

---

## 1. What gets deployed

| Item | Notes |
|------|--------|
| **Build step** | Not required — backend is plain JavaScript (`server.js`). Production = install **dependencies only** (no `tsc` / bundler). |
| **Process manager** | **PM2** keeps `node server.js` running after SSH disconnect. |
| **Public access** | Recommended: **Nginx** on port **80/443** → reverse proxy to **127.0.0.1:5000**. Do **not** open port **5000** in the security group. |

---

## 2. Project folder setup on EC2 (Ubuntu)

Recommended layout (adjust `ubuntu` / path if you use another user):

```text
/home/ubuntu/telehealth_platform_full_production/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   ├── .env                 ← create on server (not committed)
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── uploads/             ← created at runtime for recordings
└── deploy/
    ├── ecosystem.config.cjs
    └── env.backend.ec2.example
```

**Option A — Git (recommended if you use a remote):**

```bash
cd /home/ubuntu
git clone YOUR_REPO_URL telehealth_platform_full_production
cd telehealth_platform_full_production
```

**Option B — Upload from your PC (Windows PowerShell example):**

```powershell
scp -i "C:\path\to\your-key.pem" -r "C:\path\to\telehealth_platform_full_production\backend" ubuntu@YOUR_EC2_PUBLIC_IP:/home/ubuntu/telehealth_platform_full_production/
scp -i "C:\path\to\your-key.pem" -r "C:\path\to\telehealth_platform_full_production\deploy" ubuntu@YOUR_EC2_PUBLIC_IP:/home/ubuntu/telehealth_platform_full_production/
```

**Option C — `rsync` from Linux/Mac:**

```bash
rsync -avz -e "ssh -i ~/.ssh/your-key.pem" \
  ./telehealth_platform_full_production/backend/ \
  ./telehealth_platform_full_production/deploy/ \
  ubuntu@YOUR_EC2_PUBLIC_IP:/home/ubuntu/telehealth_platform_full_production/
```

---

## 3. Install system dependencies (Node 20, PM2)

SSH into the server:

```bash
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

Then:

```bash
sudo apt update && sudo apt upgrade -y

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential

sudo npm install -g pm2

node -v
npm -v
pm2 -v
```

---

## 4. Backend dependencies (production install)

This project has **no compile step**. Use production install (omit devDependencies like `nodemon`):

```bash
cd /home/ubuntu/telehealth_platform_full_production/backend
npm ci --omit=dev
```

If you do **not** have `package-lock.json` on the server, use:

```bash
npm install --omit=dev
```

**Smoke test (optional):**

```bash
node -e "import('./server.js').catch(()=>{})"
# Better: set MONGODB_URI in .env first, then:
# node server.js   # Ctrl+C after you see "Server running..."
```

---

## 5. Environment variables

Create `backend/.env` on the server:

```bash
cd /home/ubuntu/telehealth_platform_full_production/backend
cp ../deploy/env.backend.ec2.example .env
nano .env
```

**Example `.env` (fill with your real values):**

```env
NODE_ENV=production
HOST=127.0.0.1
PORT=5000

MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/DATABASE_NAME
JWT_SECRET=use_a_long_random_secret_at_least_32_chars

# Must match how users open the app in the browser (Nginx URL)
CORS_ORIGIN=http://YOUR_EC2_PUBLIC_IP
# If you use HTTPS + domain later:
# CORS_ORIGIN=https://app.yourdomain.com

WS_PATH=/socket.io

LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_SECRET=your_livekit_secret
LIVEKIT_URL=wss://your-project.livekit.cloud
```

**Important**

- **`HOST=127.0.0.1`** — Node listens only on localhost; **Nginx** is the public entry (good practice).
- **`CORS_ORIGIN`** — scheme + host must match the frontend (e.g. `http://1.2.3.4` with no trailing slash, or your domain).

---

## 6. PM2 ecosystem file

This repo already includes **`deploy/ecosystem.config.cjs`**. It sets `cwd` to `backend/` and binds the app to **127.0.0.1:5000**.

View it:

```bash
cat /home/ubuntu/telehealth_platform_full_production/deploy/ecosystem.config.cjs
```

Start the app with PM2 **from the repository root**:

```bash
cd /home/ubuntu/telehealth_platform_full_production
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
# Run the command `pm2 startup` prints (once), so PM2 restarts after reboot
```

Useful commands:

```bash
pm2 status
pm2 logs telehealth-api
pm2 restart telehealth-api
pm2 stop telehealth-api
```

---

## 7. `npm start` vs `pm2 start`

| Command | When to use |
|---------|-------------|
| **`npm start`** | Manual test: runs `node server.js` (see `package.json`). Stops when you close SSH unless you use `nohup`/screen. |
| **`pm2 start ...`** | **Production** — keeps process alive, restarts on crash, survives logout. |

**Manual run (debug only):**

```bash
cd /home/ubuntu/telehealth_platform_full_production/backend
npm start
```

**Production (recommended):**

```bash
cd /home/ubuntu/telehealth_platform_full_production
pm2 start deploy/ecosystem.config.cjs
```

Verify locally on the server (should return JSON):

```bash
curl -s http://127.0.0.1:5000/health
```

---

## 8. AWS security group

| Type | Port | Source |
|------|------|--------|
| SSH | 22 | Your IP (recommended) |
| HTTP | 80 | 0.0.0.0/0 (or restrict later) |
| HTTPS | 443 | 0.0.0.0/0 (when you add TLS) |

**Do not** expose **5000** publicly if Nginx proxies to localhost.

---

## 9. NGINX reverse proxy (install + config)

Install Nginx:

```bash
sudo apt install -y nginx
```

Copy the sample site config from this repo (edit `root` if your frontend path differs):

```bash
sudo cp /home/ubuntu/telehealth_platform_full_production/deploy/nginx-telehealth.conf /etc/nginx/sites-available/telehealth
sudo ln -sf /etc/nginx/sites-available/telehealth /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

Edit the file if needed (especially `root` for static files and `server_name`):

```bash
sudo nano /etc/nginx/sites-available/telehealth
```

Test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

**Minimal proxy-only snippet** (if you only need API + WebSocket, no static files on this server):

```nginx
server {
    listen 80;
    server_name _;

    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /health {
        proxy_pass http://127.0.0.1:5000/health;
        proxy_set_header Host $host;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

Test from your laptop (replace IP):

```bash
curl -s http://YOUR_EC2_PUBLIC_IP/health
```

---

## 10. Checklist

- [ ] `backend/.env` present with `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`
- [ ] `npm ci --omit=dev` in `backend/`
- [ ] `curl http://127.0.0.1:5000/health` works on EC2
- [ ] `pm2 start deploy/ecosystem.config.cjs` + `pm2 save` + `pm2 startup`
- [ ] Nginx configured and `sudo nginx -t` passes
- [ ] Security group allows 80/443, **not** public 5000
- [ ] Frontend built with same-origin API (`VITE_API_URL=/api`) if served by same Nginx — see `frontend/.env.production.example`

---

## 11. Troubleshooting

```bash
# Backend not listening
sudo ss -tlnp | grep 5000

# PM2 errors
pm2 logs telehealth-api --lines 100

# Nginx errors
sudo tail -f /var/log/nginx/error.log

# Mongo connection
# Confirm Atlas IP allowlist includes 0.0.0.0/0 (or EC2 egress IP) for testing
```

---

*Files in this repo: `deploy/ecosystem.config.cjs`, `deploy/env.backend.ec2.example`, `deploy/nginx-telehealth.conf`.*
