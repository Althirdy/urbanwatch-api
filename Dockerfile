# ==============================
# UNIFIED BUILDER (PHP 8.3 + Node)
# ==============================
FROM php:8.3-apache

# 1. Install System Dependencies
# We add 'nodejs' and 'npm' here so Vite can run
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    curl \
    git \
    nodejs \
    npm \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd \
    && pecl install redis \
    && docker-php-ext-enable redis

# 2. Enable Apache Rewrite
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf
RUN a2enmod rewrite

# 3. Setup Work Directory
WORKDIR /var/www/html

# 4. Copy Application Files
COPY . .

# 5. Install PHP Dependencies (Composer)
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
RUN composer install --no-interaction --optimize-autoloader

# 6. Install Node Dependencies & BUILD
# Now that PHP 8.3 is here, this will work
RUN npm ci
RUN npm run build

# 7. Set Permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache      