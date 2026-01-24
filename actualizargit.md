# Guía de Comandos Git para Mone.yo

Esta guía contiene los comandos básicos y recomendados para subir tus cambios al repositorio de GitHub.

## 1. Flujo Estándar (Recomendado)

Sigue estos pasos para subir tus cambios de forma segura:

```powershell
# Ver qué archivos has modificado
git status

# Añadir todos los cambios al área de preparación (staging)
git add .

# O añadir un archivo específico (ejemplo)
# git add src/app/api/stats/route.ts

# Crear el commit con un mensaje descriptivo
git commit -m "Descripción de lo que has cambiado"

# Subir los cambios a GitHub
git push origin main
```

---

## 2. Comandos Útiles de Consulta

| Comando | Descripción |
| :--- | :--- |
| `git status` | Muestra el estado actual (archivos modificados, nuevos o borrados). |
| `git log -n 5` | Muestra los últimos 5 commits realizados. |
| `git diff` | Muestra los cambios específicos línea por línea antes de hacer `add`. |

---

## 3. Resolución de Problemas Comunes

### Si hay cambios en el servidor que no tienes en local:
```powershell
# Descargar y mezclar cambios remotos
git pull origin main
```

### Si quieres deshacer los cambios de un archivo antes de hacer add:
```powershell
git checkout -- nombre_del_archivo.tsx
```

### Si has hecho `git add` pero quieres sacar un archivo (ej: datos privados):
```powershell
git restore --staged "Nombre del Archivo.csv"
```

---

## 4. Recordatorio de Seguridad
**¡CUIDADO!** Nunca hagas `git add .` si tienes archivos con datos sensibles (como `Movimientos Principal.csv`) en la carpeta raíz a menos que quieras que se suban a GitHub. 

Si quieres ignorar un archivo para siempre, añádelo al archivo `.gitignore`.
