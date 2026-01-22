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
- **Cambiar Contraseña.**
- **Activar 2FA:** Configura la Autenticación de Doble Factor con Google Authenticator para mayor seguridad.
- **Reporte Mensual:** Activa o desactiva la recepción del análisis financiero por email.

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
1. Haz clic en el icono de la **Cámara** en el menú o dashboard.
2. Selecciona un archivo (Imagen o PDF) o usa la **Cámara Directa** si estás en un móvil.
3. La IA procesará la imagen y extraerá automáticamente: *Comercio, Fecha, Importe y Categoría Sugerida*.
4. Revisa los datos y haz clic en **Guardar**. El documento quedará adjunto a la transacción.

---

## 📊 3. Presupuestos (Control de Gasto)

La sección de **Presupuestos** te permite establecer límites mensuales por categoría para evitar gastos excesivos.

- **Crear Presupuesto:** Haz clic en "Nuevo" y selecciona una categoría y un importe máximo mensual.
- **Seguimiento:** El sistema muestra una barra de progreso que cambia de color según el consumo (Verde: OK, Amarillo: >80%, Rojo: Exceso).
- **Clonación Inteligente:** Al crear un presupuesto, puedes seleccionar otros meses del año para aplicar el mismo límite automáticamente.
- **Importar del mes anterior:** Si ya configuraste presupuestos el mes pasado, puedes traerlos al mes actual con un solo clic.

---

## 🏦 4. Cuentas y Patrimonio

### Crear Cuentas
Dirígete a la sección de **Cuentas** para gestionar tus bancos, carteras o inversiones:
- Asigna un **Saldo Inicial** para reflejar tu situación real al empezar.
- El sistema calculará automáticamente el saldo actual basado en tus transacciones.

### Transferencias entre Cuentas
Para mover dinero (ej. retiro de efectivo), crea una transacción de tipo **Transferencia**. Esto ajusta los saldos de ambas cuentas sin afectar tus estadísticas de ingresos o gastos globales.

---

## ⚙️ 5. Configuración del Cerebro IA

A diferencia de otros sistemas, Mone.yo permite personalizar totalmente el comportamiento de su Inteligencia Artificial desde la interfaz, sin tocar código.

### Acceso a la Configuración IA
Ve a **Configuración > Inteligencia Artificial (Cerebro IA)**. Aquí podrás modificar:

1. **Identificador del Modelo:** Define qué modelo de Google Gemini utilizar (ej. `gemini-2.5-flash-image`).
2. **System Prompt (Lógica de Tickets):** Configura las instrucciones que recibe la IA para leer tus tickets. Puedes ajustar el tono, el idioma o reglas específicas de extracción.
3. **Lógica de Importación (PDF):** Modifica cómo la IA interpreta los extractos bancarios en PDF.
4. **Informe Mensual:** 
   - Define el **Email de Destino** y el **Día del Mes** para el envío.
   - Personaliza el **Prompt de Análisis**: Dile a la IA si quieres un tono motivador, un análisis técnico o consejos específicos.
   - **Probar Informe:** Botón para generar y enviar un reporte de prueba al instante.

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
