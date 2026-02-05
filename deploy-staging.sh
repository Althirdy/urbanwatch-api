#!/bin/bash
set -e

# Make this script executable if it isn't already
if [ ! -x "$0" ]; then
    chmod +x "$0"
    echo "✅ Made deploy script executable"
fi

echo "🚀 Starting optimized deployment..."

# Detect if running in CI/CD environment
IS_CI=false
if [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ] || [ -n "$GITLAB_CI" ] || [ -n "$JENKINS_HOME" ]; then
    IS_CI=true
    echo "🤖 CI/CD environment detected"
fi

# 1. Fix permissions before git operations (skip sudo in CI)
if [ "$IS_CI" = false ]; then
    echo "🔧 Fixing file permissions..."
    if [ -w "storage" ]; then
        # We have write permission, try normal ownership change
        sudo chown -R $(whoami):$(whoami) . 2>/dev/null || {
            echo "⚠️  Unable to change ownership (sudo required), attempting workaround..."
            # Alternative: just make files writable
            chmod -R u+w storage bootstrap/cache 2>/dev/null || true
        }
    else
        echo "⚠️  Requesting sudo access to fix permissions..."
        sudo chown -R $(whoami):$(whoami) .
    fi
else
    echo "🔧 Fixing file permissions (CI mode - no sudo)..."
    chmod -R u+w storage bootstrap/cache 2>/dev/null || true
fi

# 2. Clean up any local changes and untracked files
echo "🧹 Cleaning up local changes..."
git reset --hard HEAD 2>/dev/null || {
    echo "⚠️  Git reset failed, trying force cleanup..."
    rm -rf storage/*/. gitignore 2>/dev/null || true
    git reset --hard HEAD
}
git clean -fd

# 3. Pull the latest code (handle CI environments)
echo "📥 Pulling latest code from origin staging..."
if [ "$IS_CI" = true ]; then
    # In CI, the code is typically already checked out at the right commit
    echo "📌 CI environment - code already at correct commit"
    git fetch origin staging
else
    # In non-CI environments, pull normally
    git pull origin staging
fi

# Ensure deployment scripts are executable after pull
chmod +x deploy-staging.sh setup.sh 2>/dev/null || true

# 4. Apply infrastructure changes (like new Redis service)
echo "🏗️ Applying infrastructure changes..."
docker compose -f docker-compose.uat.yml up -d

# 5. Run build and optimization commands
echo "📦 Installing dependencies..."
docker compose -f docker-compose.uat.yml exec -T uat-app composer install --no-dev --no-interaction --optimize-autoloader
docker compose -f docker-compose.uat.yml exec -T uat-app npm install --no-audit --no-fund

echo "🏗️ Building frontend assets..."
docker compose -f docker-compose.uat.yml exec -T uat-app npm run build

echo "🗄️ Running database migrations..."
docker compose -f docker-compose.uat.yml exec -T uat-app php artisan migrate --force

echo "🌱 Seeding system settings..."
docker compose -f docker-compose.uat.yml exec -T uat-app php artisan db:seed --class=SystemSettingsSeeder --force

echo "⚡ Optimizing application..."
docker compose -f docker-compose.uat.yml exec -T uat-app php artisan optimize

echo "🔒 Setting final permissions..."
docker compose -f docker-compose.uat.yml exec -T uat-app chown -R www-data:www-data storage bootstrap/cache
docker compose -f docker-compose.uat.yml exec -T uat-app chmod -R 775 storage bootstrap/cache

echo "♻️  Restarting services to apply changes..."
docker compose -f docker-compose.uat.yml restart uat-app

echo "✅ Deployment completed successfully!"