#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_DIR="$ROOT/apps/backend/.medusa/server"

if [ ! -d "$SERVER_DIR" ]; then
  echo "Missing $SERVER_DIR — run medusa build first"
  exit 1
fi

cd "$SERVER_DIR"
rm -rf node_modules
ln -sfn "$ROOT/node_modules" node_modules
echo "Linked production server to workspace node_modules"
