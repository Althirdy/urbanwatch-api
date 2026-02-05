#!/bin/bash
set -e

echo "🚀 Starting optimized deployment..."

# 1. Clean up any local changes and untracked files
echo "🧹 Cleaning up local changes..."
git reset --hard HEAD
git clean -fd

# 2. Pull the latest code
echo "📥 Pulling latest code from origin staging..."
git pull origin staging
# 3. Apply infrastructure changes (like new Redis service)
echo "🏗️ Applying infrastructure changes..."
docker compose -f docker-compose.uat.yml up -d

# 4. Run build and optimization commands
docker compose -f docker-compose.uat.yml exec -T uat-app composer install --no-dev --no-interaction --optimize-autoloader
docker compose -f docker-compose.uat.yml exec -T uat-app npm install --no-audit --no-fund
docker compose -f docker-compose.uat.yml exec -T uat-app npm run build
docker compose -f docker-compose.uat.yml exec -T uat-app php artisan migrate --force
docker compose -f docker-compose.uat.yml exec -T uat-app php artisan db:seed --class=SystemSettingsSeeder --force
docker compose -f docker-compose.uat.yml exec -T uat-app php artisan optimize
docker compose -f docker-compose.uat.yml exec -T uat-app chown -R www-data:www-data storage bootstrap/cache

echo "✅ Finished in record time!"