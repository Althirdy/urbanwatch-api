#!/bin/bash
set -e

echo "🚀 Starting optimized deployment..."

# 1. Pull code first
git pull origin staging

# 2. Run commands with 'non-interaction' flags to prevent hanging
docker compose -f docker-compose.uat.yml exec -T uat-app composer install --no-dev --no-interaction --optimize-autoloader
docker compose -f docker-compose.uat.yml exec -T uat-app npm install --no-audit --no-fund
docker compose -f docker-compose.uat.yml exec -T uat-app npm run build
docker compose -f docker-compose.uat.yml exec -T uat-app php artisan migrate --force
docker compose -f docker-compose.uat.yml exec -T uat-app php artisan db:seed --class=SystemSettingsSeeder --force
docker compose -f docker-compose.uat.yml exec -T uat-app php artisan optimize
docker compose -f docker-compose.uat.yml exec -T uat-app chown -R www-data:www-data storage bootstrap/cache

echo "✅ Finished in record time!"