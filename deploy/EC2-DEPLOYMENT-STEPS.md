# Complete EC2 deployment — Node.js backend (Ubuntu)

Copy-paste on **Ubuntu 22.04/24.04**. Replace:

- `YOUR_EC2_PUBLIC_IP` — instance public IPv4  
- `YOUR_KEY.pem` — path to your SSH private key  
- `C:\path\to\telehealth_platform_full_production` — local project path (Windows)  
- Repository paths assume: `/home/ubuntu/telehealth_platform_full_production`

**Repo files used**

| File | Role |
|------|------|
| `deploy/env.backend.ec2.example` | Template → `backend/.env` |
| `deploy/ecosystem.config.cjs` | PM2 (filename is `.cjs`, not `.js`) |
| `deploy/nginx-telehealth.conf` | Nginx site config |

---

## 1. Install Node.js (curl + apt)

```bash
sudo apt update && sudo apt upgrade -y

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential

node -v
npm -v
```

---

## 2. Install PM2 globally

```bash
sudo npm install -g pm2
pm2 -v
```

---

## 3. Upload project folder to EC2 (scp)

From **your PC** (PowerShell). Upload **backend** and **deploy** (PM2 + Nginx templates live under `deploy/`).

**Windows (PowerShell):**

```powershell
# Create parent folder on server (first SSH session)
ssh -i "C:\path\to\YOUR_KEY.pem" ubuntu@YOUR_EC2_PUBLIC_IP "mkdir -p /home/ubuntu/telehealth_platform_full_production"

# Upload backend
scp -i "C:\path\to\YOUR_KEY.pem" -r "C:\path\to\telehealth_platform_full_production\backend" ubuntu@YOUR_EC2_PUBLIC_IP:/home/ubuntu/telehealth_platform_full_production/

# Upload deploy (ecosystem + nginx + env example)
scp -i "C:\path\to\YOUR_KEY.pem" -r "C:\path\to\telehealth_platform_full_production\deploy" ubuntu@YOUR_EC2_PUBLIC_IP:/home/ubuntu/telehealth_platform_full_production/
```

**Linux / macOS:**

```bash
ssh -i ~/.ssh/YOUR_KEY.pem ubuntu@YOUR_EC2_PUBLIC_IP "mkdir -p /home/ubuntu/telehealth_platform_full_production"

scp -i ~/.ssh/YOUR_KEY.pem -r ./telehealth_platform_full_production/backend ubuntu@YOUR_EC2_PUBLIC_IP:/home/ubuntu/telehealth_platform_full_production/

scp -i ~/.ssh/YOUR_KEY.pem -r ./telehealth_platform_full_production/deploy ubuntu@YOUR_EC2_PUBLIC_IP:/home/ubuntu/telehealth_platform_full_production/
```

SSH in and confirm:

```bash
ssh -i ~/.ssh/YOUR_KEY.pem ubuntu@YOUR_EC2_PUBLIC_IP
ls -la /home/ubuntu/telehealth_platform_full_production/backend/server.js
ls -la /home/ubuntu/telehealth_platform_full_production/deploy/ecosystem.config.cjs
```

---

## 4. Create `.env` using `env.backend.ec2.example`

```bash
cd /home/ubuntu/telehealth_platform_full_production/backend
cp ../deploy/env.backend.ec2.example .env
nano .env
```

Fill at least: `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN` (e.g. `http://YOUR_EC2_PUBLIC_IP`), keep `HOST=127.0.0.1` and `PORT=5000` for use behind Nginx.

Save: `Ctrl+O`, Enter, `Ctrl+X`.

---

## 5. Install dependencies (`npm install`)

```bash
cd /home/ubuntu/telehealth_platform_full_production/backend
npm install --omit=dev
```

*(If `package-lock.json` is present and you want reproducible installs, use `npm ci --omit=dev` instead.)*

---

## 6. Start backend with PM2 using ecosystem file

This repo’s PM2 file is **`deploy/ecosystem.config.cjs`** (CommonJS). Start from **repository root**:

```bash
cd /home/ubuntu/telehealth_platform_full_production
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
# Run the one-time command that PM2 prints (systemd), then:
pm2 save
```

Quick local check on the server:

```bash
curl -s http://127.0.0.1:5000/health
```

---

## 7. Install & configure NGINX reverse proxy

```bash
sudo apt install -y nginx
```

---

## 8. Add NGINX config from `nginx-telehealth.conf`

```bash
sudo cp /home/ubuntu/telehealth_platform_full_production/deploy/nginx-telehealth.conf /etc/nginx/sites-available/telehealth
```

Edit `root` if your built frontend lives elsewhere (optional until you upload `dist`):

```bash
sudo nano /etc/nginx/sites-available/telehealth
```

Enable site and disable default:

```bash
sudo ln -sf /etc/nginx/sites-available/telehealth /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

---

## 9. Enable and restart NGINX

```bash
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
sudo systemctl status nginx --no-pager
```

---

## 10. Open required firewall ports

**UFW (on the instance):**

```bash
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw --force enable
sudo ufw status verbose
```

**AWS Security Group** (console): inbound **22** (your IP), **80**, **443**. Do **not** expose **5000** publicly if Nginx proxies to `127.0.0.1:5000`.

---

## 11. PM2 — logs, restart, status

```bash
# Status
pm2 status

# Logs (stream)
pm2 logs telehealth-api

# Logs (last 80 lines, no stream)
pm2 logs telehealth-api --lines 80 --nostream

# Restart (after code or .env change)
pm2 restart telehealth-api

# Save process list after changes
pm2 save
```

---

## 12. Final verification steps

**On EC2:**

```bash
# Backend directly (localhost)
curl -s http://127.0.0.1:5000/health

# Through Nginx (use server's public IP or domain)
curl -s http://YOUR_EC2_PUBLIC_IP/health
```

**From your PC browser:**

- `http://YOUR_EC2_PUBLIC_IP/health` — should return JSON.

**If you use the full `nginx-telehealth.conf` with `root` pointing to `frontend/dist`:**

- Upload built assets first, then open `http://YOUR_EC2_PUBLIC_IP/`.

**Troubleshooting:**

```bash
pm2 logs telehealth-api --lines 50 --nostream
sudo tail -30 /var/log/nginx/error.log
sudo ss -tlnp | grep -E '5000|80'
```

---

## Optional: name alias for ecosystem

If you prefer the filename `ecosystem.config.js`, you can symlink:

```bash
cd /home/ubuntu/telehealth_platform_full_production/deploy
ln -sf ecosystem.config.cjs ecosystem.config.js
cd ..
pm2 start deploy/ecosystem.config.js
```

The shipped file remains **`ecosystem.config.cjs`** (PM2 + `require`).
