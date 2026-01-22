# 📖 Manual de Usuario - Mone.yo

Bienvenido a **Mone.yo**, tu asistente financiero personal potenciado por Inteligencia Artificial. Este manual te guiará a través de todas las funcionalidades de la aplicación para que puedas sacar el máximo provecho de tus finanzas.

---

## 🚀 1. Primeros Pasos

### Acceso Inicial
Para acceder por primera vez, utiliza las credenciales de administrador configuradas durante la instalación:
- **Email:** `admin@moneyo.com`
- **Contraseña:** `admin123`
*(Se recomienda cambiar estos datos lo antes posible desde el perfil de usuario).*

### Configuración del Perfil
Haz clic en tu nombre/avatar en la barra de navegación superior para:
- **Cambiar Contraste/Contraseña.**
- **Activar 2FA:** Configura la Autenticación de Doble Factor con Google Authenticator para mayor seguridad.
- **Reporte Mensual:** Activa o desactiva la recepción del análisis financiero por email generado por la IA.

---

## 💸 2. Gestión de Transacciones

### Registro Manual
1. En el Dashboard o en la sección de Transacciones, busca el botón **"+" o "Nueva Transacción"**.
2. Rellena los campos:
   - **Concepto:** Descripción del gasto o ingreso.
   - **Importe:** Cantidad numérica.
   - **Tipo:** Selecciona si es un Gasto o un Ingreso.
   - **Cuenta:** Elige la cuenta de origen/destino (ej. Banco, Efectivo).
   - **Categoría:** Clasifica el movimiento (ej. Alimentación, Vivienda).
   - **Fecha:** Por defecto se usa la actual.

### 📷 Registro con IA Vision (Cámara/Tickets)
Esta es la función estrella de Mone.yo. Permite registrar gastos subiendo una foto del ticket:
1. Haz clic en el icono de la **Cámara** en el menú o dashboard.
2. Selecciona un archivo (Imagen o PDF) o usa la **Cámara Directa** si estás en un móvil.
3. La IA procesará la imagen y extraerá automáticamente: *Comercio, Fecha, Importe y Categoría Sugerida*.
4. Revisa los datos y haz clic en **Guardar**. El documento quedará adjunto a la transacción para futuras consultas.

---

## 🏦 3. Cuentas y Patrimonio

### Crear Cuentas
Dirígete a la sección de **Cuentas**:
- Puedes añadir nuevas cuentas como "Banco Santader", "Billetera Real", "Exchange Cripto", etc.
- Asigna un **Saldo Inicial** si ya tienes dinero en ellas antes de empezar a usar la app.

### Transferencias entre Cuentas
Para mover dinero entre tus propias cuentas (ej. sacar dinero del cajero):
1. Crea una nueva transacción de tipo **Transferencia**.
2. Selecciona la **Cuenta Origen** y la **Cuenta Destino**.
3. Esto no contará como un gasto ni como un ingreso en tus reportes globales, solo moverá el saldo.

---

## 🤖 4. Inteligencia Artificial y Personalización

### Consultas al "Cerebro IA"
En la parte inferior derecha (o sección dedicada), encontrarás el chat con la IA:
- Puedes preguntar cosas como: *"¿Cuánto he gastado en comida este mes?"*, *"¿Puedo permitirme comprar una suscripción de 20€?"* o *"Analiza mi tendencia de ahorro"*.
- La IA tiene acceso a tus datos (de forma segura y privada) para darte respuestas precisas.

### 📧 Reportes Mensuales
Si tienes activada la opción en tu perfil, el primer día de cada mes recibirás un email con:
- Resumen de ingresos vs gastos.
- Análisis de salud financiera realizado por Gemini.
- Consejos personalizados para ahorrar el próximo mes.

---

## ⚙️ 5. Configuración Avanzada (Admin)

### Gestión de Categorías y Tipos de Cuenta
Si eres administrador, puedes personalizar la estructura de la app:
- **Categorías:** Crea nuevas categorías con colores e iconos personalizados.
- **Tipos de Cuenta:** Define si quieres separar cuentas por "Inversión", "Ahorro", "Gasto diario", etc.

### 🧠 Configuración de Prompts de la IA (Desarrolladores/Power Users)
Para ajustar cómo responde la IA o cómo extrae datos de los tickets, los archivos de configuración se encuentran en el código fuente:

1. **Prompt de IA Vision (Extracción de Tickets):**
   - Archivo: `src/lib/gemini.ts` -> Función `processReceipt`.
   - Aquí puedes modificar las instrucciones que recibe la IA para ser más específica con el formato JSON de salida o el idioma.

2. **Prompt de Análisis Mensual:**
   - Archivo: `src/lib/gemini.ts` -> Función `analyzeMonthlyStatus`.
   - Puedes ajustar el "tono" de la IA (más estricto, más motivador) y qué datos priorizar en el análisis.

3. **Prompt del Asistente (Chat):**
   - Archivo: `src/app/api/chat/route.ts`.
   - Configura el contexto global que tiene la IA sobre tu aplicación.

---

## 🛡️ 6. Seguridad y Mantenimiento

- **Copias de Seguridad:** Se recomienda realizar exportaciones periódicas de tu base de datos PostgreSQL.
- **Actualizaciones:** Para actualizar la app desde GitHub:
  ```bash
  git pull origin main
  npm install
  npm run build
  pm2 restart moneyo
  ```

---
**Mone.yo** - *Toma el control de tu futuro financiero.*
