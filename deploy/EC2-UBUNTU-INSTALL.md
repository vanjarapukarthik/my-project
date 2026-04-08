# EC2 Ubuntu — installation & runbook (Telehealth backend + Nginx)

Copy-paste friendly. Replace placeholders: `YOUR_EC2_IP`, `your-key.pem`, paths if your layout differs.

> **Env file note:** On the **server**, create `backend/.env` from **`deploy/env.backend.ec2.example`**.  
> The file **`frontend/.env.production.example`** is only for **`npm run build`** on your PC — do not use it as the Node server’s `.env`.

---

## 1. Install Node.js (LTS 20.x)

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential
node -v
npm -v
```

---

## 2. Install PM2 (global)

```bash
sudo npm install -g pm2
pm2 -v
```

---

## 3. Copy backend code to EC2

**Option A — Git**

```bash
cd /home/ubuntu
git clone YOUR_REPOSITORY_URL telehealth_platform_full_production
cd telehealth_platform_full_production
```

**Option B — From your PC (PowerShell)**

```powershell
scp -i "C:\path\to\your-key.pem" -r "C:\path\to\telehealth_platform_full_production\backend" ubuntu@YOUR_EC2_PUBLIC_IP:/home/ubuntu/telehealth_platform_full_production/
scp -i "C:\path\to\your-key.pem" -r "C:\path\to\telehealth_platform_full_production\deploy" ubuntu@YOUR_EC2_PUBLIC_IP:/home/ubuntu/telehealth_platform_full_production/
```

**Option C — `rsync` (Linux/macOS)**

```bash
rsync -avz -e "ssh -i ~/.ssh/your-key.pem" \
  ./telehealth_platform_full_production/backend/ \
  ./telehealth_platform_full_production/deploy/ \
  ubuntu@YOUR_EC2_PUBLIC_IP:/home/ubuntu/telehealth_platform_full_production/
```

Ensure on the server you have:

```text
/home/ubuntu/telehealth_platform_full_production/backend/   (server.js, package.json, …)
/home/ubuntu/telehealth_platform_full_production/deploy/      (ecosystem.config.cjs, nginx sample, env template)
```

---

## 4. Create `.env` (from server template)

Backend template in this repo: **`deploy/env.backend.ec2.example`**.

```bash
cd /home/ubuntu/telehealth_platform_full_production/backend
cp ../deploy/env.backend.ec2.example .env
nano .env
```

Set at minimum:

| Variable | Example |
|----------|---------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string |
| `CORS_ORIGIN` | `http://YOUR_EC2_PUBLIC_IP` (same as users use in the browser) |
| `HOST` | `127.0.0.1` (recommended behind Nginx) |
| `PORT` | `5000` |

Save: `Ctrl+O`, Enter, `Ctrl+X`.

**Install production dependencies:**

```bash
cd /home/ubuntu/telehealth_platform_full_production/backend
npm ci --omit=dev
# If package-lock.json is missing: npm install --omit=dev
```

---

## 5. Start server with PM2

From **repository root** (so `deploy/ecosystem.config.cjs` resolves `backend/` correctly):

```bash
cd /home/ubuntu/telehealth_platform_full_production
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
# Run the command PM2 prints once (systemd hook for reboot)
```

Verify Node is listening on localhost only:

```bash
curl -s http://127.0.0.1:5000/health
```

---

## 6. NGINX reverse proxy

Install Nginx:

```bash
sudo apt install -y nginx
```

Install site config (edit `root` inside file if your frontend path differs):

```bash
sudo cp /home/ubuntu/telehealth_platform_full_production/deploy/nginx-telehealth.conf /etc/nginx/sites-available/telehealth
sudo ln -sf /etc/nginx/sites-available/telehealth /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

If you only deploy **API** on this instance (no static UI yet), use a minimal config or comment out the `root` / `try_files` block and proxy only `/api`, `/health`, `/socket.io` — see `deploy/nginx-telehealth.conf`.

Test from your laptop:

```bash
curl -s http://YOUR_EC2_PUBLIC_IP/health
```

---

## 7. Firewall rules (UFW)

Allow SSH first, then HTTP/HTTPS, then enable:

```bash
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw enable
sudo ufw status verbose
```

**AWS Security Group** (console): same idea — allow **22** (your IP), **80**, **443**; **do not** expose **5000** to the world if Nginx proxies to `127.0.0.1:5000`.

---

## 8. Restart server & view logs

**PM2 (application)**

```bash
# Restart after code or .env changes
cd /home/ubuntu/telehealth_platform_full_production
pm2 restart telehealth-api

# Logs (live)
pm2 logs telehealth-api

# Last N lines
pm2 logs telehealth-api --lines 100 --nostream

# Status
pm2 status
```

**Nginx**

```bash
sudo systemctl reload nginx
sudo systemctl restart nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

**Quick health checks**

```bash
curl -s http://127.0.0.1:5000/health
curl -s http://YOUR_EC2_PUBLIC_IP/health
```

---

## Frontend reminder (separate step)

Build on your PC with `frontend/.env.production.example` → `.env.production`, then `npm run build`, upload `frontend/dist` to the path in Nginx `root`, or serve from another bucket/CloudFront. See `deploy/AWS-TELEHEALTH.md`.
