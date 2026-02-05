#!/bin/bash

# Script to fix location category removal

echo "Fixing location category removal..."

# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Run the migration to remove location_category column
php artisan migrate

echo "Done! Location category column has been removed and caches cleared."
echo "Please restart your development server if it's running."
