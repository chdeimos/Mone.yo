# 📚 Guía Maestra de Skills (Habilidades) - Antigravity Kit

Esta es la documentación completa de todas las habilidades instaladas en tu proyecto. Estas habilidades permiten al Agente de IA actuar como un especialista en diferentes dominios.

---

## 🏗️ Arquitectura y Fundamentos

Estas habilidades definen cómo pensamos y estructuramos el software.

### `architecture`
*   **Qué hace:** Toma de decisiones arquitectónicas, análisis de requisitos y documentación de decisiones (ADRs).
*   **Uso:** "Define la arquitectura para un sistema de microservicios."
*   **Script:** No tiene script directo, es una metodología de pensamiento.

### `clean-code` (Activo Siempre)
*   **Qué hace:** Garantiza código limpio, legible y mantenible. Principios SOLID, DRY, KISS.
*   **Uso:** Automático. Puedes pedir: "Refactoriza este archivo aplicando Clean Code."

### `code-review-checklist`
*   **Qué hace:** Lista de verificación estricta para revisiones de código.
*   **Uso:** "Haz una code review de este PR/archivo."

### `plan-writing`
*   **Qué hace:** Estructura planes de implementación detallados paso a paso.
*   **Uso:** Usado internamente por el comando `/plan`.

### `behavioral-modes` & `intelligent-routing` & `parallel-agents`
*   **Qué hace:** Habilidades internas del sistema para gestionar la "personalidad" del agente, enrutar tareas al experto adecuado y coordinar múltiples agentes.
*   **Uso:** Automático. No necesitas invocarlos directamente.

---

## 🎨 Frontend y Diseño (UI/UX)

### `frontend-design`
*   **Qué hace:** Diseño visual, teoría del color, tipografía y psicología del usuario.
*   **Uso:** "Diseña una landing page atractiva."
*   **Script:** `python .agent/skills/frontend-design/scripts/ux_audit.py .`

### `web-design-guidelines`
*   **Qué hace:** Auditoría técnica de UI. Accesibilidad (a11y), usabilidad y estándares web.
*   **Uso:** "Revisa si mi sitio cumple con las pautas de accesibilidad."

### `nextjs-react-expert`
*   **Qué hace:** Mejores prácticas específicas para React y Next.js (RSC, optimización, hooks).
*   **Uso:** "Optimiza este componente de Next.js."

### `tailwind-patterns`
*   **Qué hace:** Patrones avanzados de Tailwind CSS v4.
*   **Uso:** "Ayúdame a crear un componente complejo con Tailwind."

### `mobile-design`
*   **Qué hace:** UX/UI específicamente para apps móviles (touch targets, navegación nativa).
*   **Uso:** "Diseña un flujo de navegación para iOS."
*   **Script:** `python .agent/skills/mobile-design/scripts/mobile_audit.py .`

### `i18n-localization`
*   **Qué hace:** Patrones para internacionalización y localización de apps.
*   **Uso:** "Prepara mi app para soportar español e inglés."
*   **Script:** `python .agent/skills/i18n-localization/scripts/i18n_checker.py .`

---

## ⚙️ Backend y APIs

### `api-patterns`
*   **Qué hace:** Diseño de APIs REST, GraphQL, tRPC. Manejo de errores y estructuras de respuesta.
*   **Uso:** "Diseña los endpoints para el carrito de compras."
*   **Script:** `python .agent/skills/api-patterns/scripts/api_validator.py .`

### `nodejs-best-practices`
*   **Qué hace:** Seguridad, performance y arquitectura en Node.js.
*   **Uso:** "Revisa la seguridad de mi servidor Express."

### `python-patterns`
*   **Qué hace:** Estándares de Python, FastAPI/Django y tipado (mypy).
*   **Uso:** "Estructura este proyecto en Python correctamente."

### `mcp-builder`
*   **Qué hace:** Creación de servidores MCP (Model Context Protocol) para conectar herramientas a IAs.
*   **Uso:** "Crea una herramienta MCP para leer mi base de datos."

---

## 🗄️ Base de Datos

### `database-design`
*   **Qué hace:** Modelado de datos, normalización y optimización de consultas.
*   **Uso:** "Diseña el esquema ER para un sistema de reservas."
*   **Script:** `python .agent/skills/database-design/scripts/schema_validator.py .`

---

## 🛡️ Seguridad

### `vulnerability-scanner`
*   **Qué hace:** Escaneo de dependencias, análisis estático (SAST) y detección de secretos.
*   **Uso:** "Busca vulnerabilidades en mi proyecto."
*   **Script:** `python .agent/skills/vulnerability-scanner/scripts/security_scan.py .`

### `red-team-tactics`
*   **Qué hace:** Simulación de ataques para probar la seguridad (Hacking ético).
*   **Uso:** "Actúa como un atacante y dime cómo romperías este login."

---

## 🧪 Testing y Calidad

### `testing-patterns`
*   **Qué hace:** Estrategias de testing (Unitarios, Integración). Jest/Vitest.
*   **Uso:** "Crea un plan de pruebas para este módulo."
*   **Script:** `python .agent/skills/testing-patterns/scripts/test_runner.py .`

### `webapp-testing`
*   **Qué hace:** Pruebas End-to-End (E2E) con Playwright/Cypress.
*   **Uso:** "Escribe un test E2E para el flujo de pago."
*   **Script:** `python .agent/skills/webapp-testing/scripts/playwright_runner.py <url>`

### `tdd-workflow`
*   **Qué hace:** Flujo de trabajo Test-Driven Development (Red-Green-Refactor).
*   **Uso:** "Implementemos esta función usando TDD."

### `lint-and-validate`
*   **Qué hace:** Configuración de Linters (ESLint, Prettier) y validación de tipos.
*   **Uso:** "Arregla los errores de linting."
*   **Scripts:**
    *   `python .agent/skills/lint-and-validate/scripts/lint_runner.py .`
    *   `python .agent/skills/lint-and-validate/scripts/type_coverage.py .`

### `systematic-debugging`
*   **Qué hace:** Metodología científica para encontrar y arreglar bugs complejos.
*   **Uso:** Se activa con el comando `/debug`.

---

## 🚀 DevOps e Infraestructura

### `deployment-procedures`
*   **Qué hace:** Estrategias de despliegue (CI/CD, Blue-Green, Rollbacks).
*   **Uso:** "Genera un pipeline de GitHub Actions."

### `server-management`
*   **Qué hace:** Gestión de servidores Linux, Nginx, Docker.
*   **Uso:** "Configura Nginx como reverse proxy."

### `bash-linux` & `powershell-windows`
*   **Qué hace:** Expertos en scripting de terminal para cada OS.
*   **Uso:** "Escribe un script para automatizar backups."

---

## 📈 Performance y SEO

### `performance-profiling`
*   **Qué hace:** Análisis de Web Vitals, tiempos de carga y optimización de bundles.
*   **Uso:** "Analiza por qué mi web carga lento."
*   **Script:** `python .agent/skills/performance-profiling/scripts/lighthouse_audit.py <url>`

### `seo-fundamentals`
*   **Qué hace:** Optimización para motores de búsqueda (Google). Meta tags, estructura, sitemaps.
*   **Uso:** "Audita el SEO de mi home page."
*   **Script:** `python .agent/skills/seo-fundamentals/scripts/seo_checker.py .`

### `geo-fundamentals`
*   **Qué hace:** Generative Engine Optimization. Optimización para ser encontrado por IAs (ChatGPT, Perplexity).
*   **Uso:** "Optimiza mi contenido para respuestas de IA."
*   **Script:** `python .agent/skills/geo-fundamentals/scripts/geo_checker.py .`

---

## 🎮 Otros Especializados

### `app-builder`
*   **Qué hace:** Orquestador para crear aplicaciones completas desde cero.
*   **Uso:** Se activa con el comando `/create`.

### `game-development`
*   **Qué hace:** Lógica de videojuegos, mecánicas y motores (Unity, Godot, JS Canvas).
*   **Uso:** "Ayúdame a programar la física de un salto."

### `documentation-templates`
*   **Qué hace:** Plantillas estándar para README, CONTRIBUTING, CHANGELOG, etc.
*   **Uso:** "Genera la documentación del proyecto."

### `brainstorming`
*   **Qué hace:** Generación de ideas y clarificación de requisitos.
*   **Uso:** Comando `/brainstorm`.

---

## ⌨️ Comandos Rápidos (Resumen)

| Comando | Acción |
| :--- | :--- |
| `/brainstorm` | Lluvia de ideas y definición de requisitos. |
| `/plan` | Crear un plan de proyecto detallado. |
| `/create` | Crear una nueva app o funcionalidad grande. |
| `/debug` | Iniciar sesión de depuración profunda. |
| `/test` | Ejecutar y generar tests. |
| `/deploy` | Validar y preparar despliegue. |
| `/status` | Ver estado del proyecto. |
