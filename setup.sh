#!/bin/bash

# UrbanWatch Setup Script
# Make sure Docker Desktop and ddev are installed before running this script

PROJECT_NAME="urbanwatch"
DOCROOT="public"
PROJECT_TYPE="laravel"

echo "🚀 Starting UrbanWatch setup..."

# Step 1: Start ddev if not already running
echo "🔹 Checking ddev project..."
if [ ! -d ".ddev" ]; then
  echo "⚙️ Configuring ddev..."
  ddev config --project-name $PROJECT_NAME --docroot $DOCROOT --project-type $PROJECT_TYPE
fi

echo "▶️ Starting ddev..."
ddev start


# Step 3: Install backend dependencies
echo "📦 Installing PHP dependencies..."
ddev composer install

# Step 4: Install frontend dependencies
echo "📦 Installing Node dependencies..."
ddev npm install


# Step 2: Build ddev (important for Laravel projects using Node/React)
echo "🏗 Running ddev build..."
ddev build

# Step 5: Setup environment
if [ ! -f ".env" ]; then
  echo "📄 Copying environment file..."
  ddev exec cp .env.example .env
else
  echo "📄 .env file already exists, skipping..."
fi

# Step 6: Generate app key
echo "🔑 Generating application key..."
ddev artisan key:generate

# Step 7: Run migrations and seeders
echo "🗂 Running database migrations..."
ddev artisan migrate

echo "🌱 Seeding database (if available)..."
ddev artisan db:seed || echo "⚠️ No seeders found, skipping."

echo "Running Npm run dev"
ddev npm run dev

# Done
echo "✅ UrbanWatch setup complete!"
echo "👉 You can now run: ddev describe"