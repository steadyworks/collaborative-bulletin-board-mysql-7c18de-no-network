#!/bin/bash

# Start MySQL in background
mysqld_safe --datadir=/var/lib/mysql &

# Wait until MySQL is ready
echo "Waiting for MySQL..."
for i in {1..60}; do
  if mysqladmin ping --silent 2>/dev/null; then
    echo "MySQL is ready"
    break
  fi
  sleep 1
done

# Create the notes database if it doesn't exist
mysql -u root -e "CREATE DATABASE IF NOT EXISTS notes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true

# Backend: install deps, run migrations, start daphne ASGI server
cd /app/backend
pip install -r requirements.txt -q
python manage.py migrate --noinput
python -m daphne -b 0.0.0.0 -p 3001 bulletinboard.asgi:application &

# Frontend: install deps and start Next.js dev server
cd /app/frontend
npm install
npm run build && npx next start --port 3000 --hostname 0.0.0.0 &
