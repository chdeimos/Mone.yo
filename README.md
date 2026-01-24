# 💰 Mone.yo - Finanzas Inteligentes con IA

Mone.yo es una plataforma moderna de gestión financiera personal que utiliza Inteligencia Artificial avanzada para ayudarte a tomar el control total de tu dinero. Diseñada con una estética premium y minimalista, Mone.yo transforma la forma en que interactúas con tus finanzas, desde la lectura automática de tickets hasta reportes estratégicos mensuales.

![Mone.yo Dashboard](imagenes/app-vision-ia.png)

## ✨ Características Principales

- **🧠 Cerebro IA (Gemini):** Integración profunda con Google Gemini para análisis financiero en tiempo real y consejos personalizados.
- **📷 IA Vision (OCR Inteligente):** Sube fotos de tus tickets o facturas y deja que la IA extraiga automáticamente el comercio, la fecha, el importe y la categoría.
- **📊 Dashboard Dinámico:** Visualización clara de tu patrimonio, evolución histórica, distribución de activos y cumplimiento de presupuestos.
- **📧 Reportes Mensuales Inteligentes:** Recibe cada mes un análisis estratégico en tu email con el desglose de tu salud financiera y áreas de mejora.
- **⏳ Transacciones Recurrentes:** Automatiza tus ingresos y gastos fijos (alquiler, nómina, suscripciones).
- **🛡️ Seguridad Avanzada:** Autenticación robusta con soporte para **Doble Factor (2FA)** mediante Google Authenticator.
- **📱 PWA (Progressive Web App):** Instala Mone.yo en tu móvil como una aplicación nativa.

## 🚀 Ventajas de Mone.yo

- **Ahorro de Tiempo:** Olvídate de introducir datos manualmente; la IA lo hace por ti.
- **Visión Estratégica:** No solo ves números, recibes interpretación y consejos.
- **Privacidad Total:** Gestión de usuarios y permisos detallada.
- **Diseño Premium:** Una interfaz oscura "Glassmorphic" optimizada para la mejor experiencia de usuario.

---

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js 14, React, Tailwind CSS, Recharts.
- **Backend:** Next.js API Routes, Server Actions.
- **Base de Datos:** PostgreSQL con Prisma ORM.
- **IA:** Google Generative AI (Gemini 2.5 Flash/Pro).
- **Correo:** Nodemailer (SMTP).
- **Seguridad:** NextAuth.js, Bcrypt, OTP (2FA).

---

## 💻 Guía de Instalación Local

### Requisitos previos
- Node.js 18+ instalado.
- PostgreSQL funcionando.
- Una API Key de Google Gemini.

### Pasos
1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/chdeimos/mone-yo.git
   cd mone-yo
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar el entorno:**
   Copia el archivo `.env.example` a `.env` y rellena tus credenciales:
   ```bash
   cp .env.example .env
   ```

4. **Sincronizar base de datos:**
   ```bash
   npx prisma db push
   npx prisma generate
   npx prisma db seed
   ```

5. **Iniciar en desarrollo:**
   ```bash
   npm run dev
   ```

---

## 🌐 Guía de Despliegue en Servidor Debian (Producción)

Esta guía asume que tienes un servidor Debian fresco con acceso root o sudo.

### 1. Preparación del Sistema
Actualiza el sistema e instala las herramientas básicas:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx
```

### 2. Instalar Node.js (v20 LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. Instalar y Configurar PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql
# Dentro de psql:
CREATE DATABASE moneyo;
CREATE USER moneyo_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE moneyo TO moneyo_user;
\q
```

### 4. Configurar la Aplicación
Clona el proyecto en `/var/www/moneyo` y configura los permisos:
```bash
sudo mkdir -p /var/www/moneyo
sudo chown $USER:$USER /var/www/moneyo
cd /var/www/moneyo
git clone https://github.com/chdeimos/Mone.yo.git
npm install

> **Nota para actualizaciones:** Si ya tenías archivos subidos, muévelos de la carpeta raíz `/uploads` a `/public/uploads` para que sigan siendo accesibles.
```

Configura el archivo `.env` de producción:
```env
DATABASE_URL="postgresql://moneyo_user:tu_password_seguro@localhost:5432/moneyo?schema=public"
GEMINI_API_KEY="tu_api_key_de_gemini"
NEXT_PUBLIC_APP_URL="https://tu-dominio.com"
NEXTAUTH_URL="https://tu-dominio.com"
NEXTAUTH_SECRET="genera_un_string_aleatorio_largo"

# SMTP para emails
SMTP_HOST=smtp.proveedor.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=user@dominio.com
SMTP_PASS=password
```

### 5. Construir y Ejecutar con PM2
Instala PM2 para mantener la app funcionando siempre:
```bash
sudo npm install -g pm2
npx prisma generate
npx prisma db seed
npm run build
pm2 start npm --name "moneyo" -- start
pm2 save
pm2 startup
```

### 6. Configurar Nginx (Reverse Proxy)
Crea una configuración para tu sitio:
```bash
sudo nano /etc/nginx/sites-available/moneyo
```
Pega lo siguiente (ajustando tu dominio):
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Activa el sitio y reinicia Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/moneyo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## �️ Mantenimiento y Actualizaciones

Para mantener el servidor al día con los últimos cambios de GitHub, puedes utilizar el script de actualización automática incluido:

1. **Dar permisos de ejecución (solo la primera vez):**
   ```bash
   chmod +x actualizacion.sh
   ```

2. **Ejecutar actualización:**
   ```bash
   ./actualizacion.sh
   ```

El script se encargará de bajar los cambios de Git, instalar nuevas dependencias, sincronizar la base de datos, construir la aplicación y reiniciar el servicio en PM2.

---

## �📝 Licencia
Distribuido bajo la Licencia MIT. Ver `LICENSE` para más información.

---
**Desarrollado con ❤️ por el equipo de Mone.yo**
