#!/usr/bin/env bash
# Run this script ON the EC2 instance from the backend folder:
#   chmod +x scripts/ec2-install.sh && ./scripts/ec2-install.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "ERROR: No .env file. Copy .env.example to .env and set at least MONGODB_URI, JWT_SECRET, CORS_ORIGIN."
  exit 1
fi

echo "Installing production dependencies..."
npm ci --omit=dev

echo ""
echo "Install OK. Test run:"
echo "  cd $ROOT && NODE_ENV=production npm start"
echo ""
echo "To run 24/7 with systemd, edit deploy/telehealth-backend.service (WorkingDirectory + ExecStart node path), then:"
echo "  sudo cp deploy/telehealth-backend.service /etc/systemd/system/"
echo "  sudo systemctl daemon-reload"
echo "  sudo systemctl enable --now telehealth-backend"
echo "  sudo systemctl status telehealth-backend"
