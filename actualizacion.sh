#!/bin/bash

# --- Script de Actualización - Mone.yo ---

# Colores para la terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Iniciando actualización de Mone.yo ===${NC}"

# 1. Obtener los últimos cambios de Git
echo -e "${YELLOW}1. Descargando cambios de GitHub...${NC}"
git fetch origin main
git reset --hard origin/main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✔ Cambios descargados correctamente.${NC}"
else
    echo -e "${RED}✘ Error al descargar cambios de Git.${NC}"
    exit 1
fi

# 2. Instalar dependencias si han cambiado
echo -e "${YELLOW}2. Instalando dependencias (npm install)...${NC}"
npm install

# 3. Generar cliente de Prisma y actualizar DB
echo -e "${YELLOW}3. Sincronizando Base de Datos (Prisma)...${NC}"
npx prisma generate
npx prisma db push

# 4. Construir la aplicación
echo -e "${YELLOW}4. Construyendo la aplicación para producción...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✔ Construcción completada.${NC}"
else
    echo -e "${RED}✘ Error en la construcción (npm run build).${NC}"
    exit 1
fi

# 5. Reiniciar el proceso en PM2
echo -e "${YELLOW}5. Reiniciando el servidor con PM2...${NC}"
pm2 restart moneyo || pm2 start npm --name "moneyo" -- start

echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}🚀 ¡Actualización completada con éxito!${NC}"
echo -e "${BLUE}=========================================${NC}"
