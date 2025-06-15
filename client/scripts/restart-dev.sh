#!/bin/bash

echo "========================================"
echo "  Restart Development Server"
echo "========================================"
echo

echo "[1/3] Killing existing development servers..."
bash "$(dirname "$0")/kill-dev-servers.sh"

echo "[2/3] Waiting for processes to terminate..."
sleep 3

echo "[3/3] Starting fresh development server..."
cd "$(dirname "$0")/.."
npm start

echo
echo "✅ Development server restarted successfully!"
