#!/bin/bash

cd /root/video-description-app
nohup node backend.js > output.txt &

export NVM_DIR="/root/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use 20

exec "$@"
npm run dev
