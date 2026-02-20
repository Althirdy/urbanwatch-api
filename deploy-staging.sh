#!/bin/bash
set -euo pipefail

echo "🚀 Starting optimized deployment..."

# Detect if running in CI/CD environment
IS_CI=false
if [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ] || [ -n "$GITLAB_CI" ] || [ -n "$JENKINS_HOME" ]; then
    IS_CI=true
    echo "🤖 CI/CD environment detected"
fi

# Ensure containers run as the host user to avoid permission issues on bind mounts.
export APP_UID="$(id -u)"
export APP_GID="$(id -g)"

# 1. Fix writable directory permissions only.
if [ "$IS_CI" = false ]; then
    echo "🔧 Fixing writable directory permissions..."
    sudo chown -R "$(whoami)":"$(whoami)" storage bootstrap/cache vendor 2>/dev/null || true
    chmod -R u+rwX storage bootstrap/cache vendor 2>/dev/null || true
else
    echo "🔧 Fixing writable directory permissions (CI mode - no sudo)..."
    chmod -R u+rwX storage bootstrap/cache vendor 2>/dev/null || true
fi

# 2. Git operations are intentionally skipped in CI.
if [ "$IS_CI" = true ]; then
    echo "📌 CI environment - using synchronized workspace commit."
else
    echo "📥 Non-CI execution - pulling latest code from origin staging..."
    git pull origin staging
fi

# Ensure deployment scripts are executable after pull
chmod +x deploy-staging.sh setup.sh 2>/dev/null || true

# 3. Apply infrastructure changes (like new Redis service)
echo "🏗️ Applying infrastructure changes..."
docker compose -f docker-compose.uat.yml up -d

# 4. Run build and optimization commands
echo "� Fixing vendor directory permissions inside container..."
docker compose -f docker-compose.uat.yml exec -T --user root uat-app chown -R "${APP_UID:-1000}:${APP_GID:-1000}" /var/www/html/vendor 2>/dev/null || true

echo "�📦 Installing dependencies..."
docker compose -f docker-compose.uat.yml exec -T uat-app composer install --no-dev --no-interaction --optimize-autoloader
docker compose -f docker-compose.uat.yml exec -T uat-app npm ci --no-audit --no-fund

echo "🏗️ Building frontend assets..."
docker compose -f docker-compose.uat.yml exec -T uat-app npm run build

echo "🗄️ Running database migrations..."
docker compose -f docker-compose.uat.yml exec -T uat-app php artisan migrate --force

echo "🌱 Seeding system settings..."
docker compose -f docker-compose.uat.yml exec -T uat-app php artisan db:seed --class=SystemSettingsSeeder --force

echo "⚡ Optimizing application..."
docker compose -f docker-compose.uat.yml exec -T uat-app php artisan optimize

echo "🔒 Setting final permissions..."
docker compose -f docker-compose.uat.yml exec -T --user root uat-app chown -R "${APP_UID:-1000}:${APP_GID:-1000}" storage bootstrap/cache public/build
docker compose -f docker-compose.uat.yml exec -T --user root uat-app chmod -R 775 storage bootstrap/cache public/build

echo "♻️  Restarting services to apply changes..."
docker compose -f docker-compose.uat.yml restart uat-app

echo "✅ Deployment completed successfully!"
