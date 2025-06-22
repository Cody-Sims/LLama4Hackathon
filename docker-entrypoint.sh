#!/bin/bash

cd /root/video-description-app
node backend.js &

sleep 3
BACKEND_PID=$!

export NVM_DIR="/root/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use 20

exec "$@"
npm run dev
