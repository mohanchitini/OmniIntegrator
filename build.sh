#!/bin/bash

# Build script for Render deployment

# Backend setup
cd server
npm install
npx prisma generate
npx prisma migrate deploy
cd ..

# AI Service setup (optional, pip will handle this automatically)
# cd ai-service
# pip install -r requirements.txt
# cd ..

echo "Build completed successfully!"
