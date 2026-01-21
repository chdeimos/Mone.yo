#!/bin/bash

# Mone.yo Deployment Script for PM2
echo "🚀 Iniciando despliegue de Mone.yo..."

# Instalación de dependencias
npm install

# Generación de Prisma Client
npx prisma generate

# Ejecución de migraciones (si aplica)
# npx prisma migrate deploy

# Construcción de la aplicación
npm run build

# Reinicio con PM2
pm2 delete moneyo || true
pm2 start npm --name "moneyo" -- start

echo "✅ Despliegue completado con éxito."
