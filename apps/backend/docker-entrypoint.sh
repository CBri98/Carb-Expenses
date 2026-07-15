#!/bin/sh
set -eu

export PATH="/workspace/node_modules/.bin:${PATH}"
cd /workspace/apps/backend

prisma migrate deploy
prisma db seed

exec node dist/main.js
