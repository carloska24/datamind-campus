#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
command -v node >/dev/null || { echo 'Instale Node.js 22.12 ou mais recente: https://nodejs.org/'; exit 1; }
node server/index.mjs
