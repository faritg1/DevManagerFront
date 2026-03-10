# 🔗 Configuración GitHub + Vercel (Auto-Deploy)

## 🎯 Objetivo
Configurar auto-deploy para que cada push a `main` (o `Farit_DevMag`) publique automáticamente a producción.

---

## 📋 Paso 1: Eliminar Deployments Duplicados

1. **Ve a tu dashboard de Vercel:**
   - https://vercel.com/faritg1s-projects

2. **Identifica los proyectos duplicados:**
   - Verás varios proyectos con nombres como `s`, `s-1`, etc.
   - Identifica cuál es el que quieres mantener

3. **Elimina los duplicados:**
   - Click en cada proyecto duplicado
   - Settings → Advanced → "Delete Project"
   - **IMPORTANTE:** Guarda el dominio del que quieres mantener

---

## 📋 Paso 2: Importar desde GitHub (Método Correcto)

### Opción A: Crear nuevo proyecto desde GitHub (Recomendada)

1. **Ve a Vercel Dashboard:**
   - https://vercel.com/new

2. **Import Git Repository:**
   - Click en "Add New" → "Project"
   - Click en "Continue with GitHub"

3. **Autorizar Vercel en GitHub:**
   - Si es la primera vez, autoriza a Vercel
   - Selecciona el repositorio: `Ewin24/DevManagerFront`
   - **IMPORTANTE:** Si no aparece, click en "Adjust GitHub App Permissions"

4. **Configurar el proyecto:**
   ```
   Project Name: devmanager-frontend (o el que prefieras)
   Framework Preset: Vite (auto-detectado ✅)
   Root Directory: ./
   Build Command: npm run build (auto-detectado ✅)
   Output Directory: dist (auto-detectado ✅)
   ```

5. **Configurar rama de producción:**
   - En "Production Branch" selecciona: `Farit_DevMag` (o `main`)
   
6. **Variables de entorno:**
   - Click en "Environment Variables"
   - Agrega:
     - `VITE_API_URL` = `https://devmanagerapi.runasp.net/api`
     - `VITE_GEMINI_API_KEY` = `tu-key-aqui`

7. **Deploy:**
   - Click en "Deploy"
   - Vercel clonará y construirá automáticamente

---

### Opción B: Conectar proyecto existente a GitHub

Si prefieres mantener el proyecto actual (`s-psi-gold.vercel.app`):

1. **Ve a tu proyecto en Vercel:**
   - https://vercel.com/faritg1s-projects/s

2. **Settings → Git:**
   - Click en "Connect Git Repository"
   - Selecciona: `Ewin24/DevManagerFront`

3. **Configura la rama de producción:**
   - Production Branch: `Farit_DevMag`

4. **Trigger deploy inicial:**
   - Haz un pequeño cambio en el código
   - Push a la rama `Farit_DevMag`
   - Vercel detectará el cambio y deployará automáticamente

---

## 🔄 Paso 3: Workflow después de configurar

### Flujo diario de trabajo:

```bash
# 1. Haces cambios en tu código local
git add .
git commit -m "feat: nueva funcionalidad"

# 2. Push a GitHub
git push origin Farit_DevMag

# 3. Vercel detecta el push automáticamente
# ✅ Deploy inicia automáticamente
# ✅ Recibes notificación cuando termina
# ✅ URL de producción se actualiza
```

**NO necesitas `vercel` CLI nunca más** (excepto para preview deployments opcionales)

---

## 🌿 Paso 4: Estrategia de Ramas (Recomendada)

### Configuración profesional:

```
main/master (producción)
  ↑
  └── Farit_DevMag (tu rama de desarrollo)
       ↑
       └── feature/nueva-funcionalidad (features temporales)
```

**Configuración en Vercel:**
- **Production Branch:** `main` (o `Farit_DevMag`)
- **Preview Branches:** Todas las demás (deploys automáticos con URLs temporales)

### Ventaja:
- Push a `Farit_DevMag` → Deploy a producción
- Push a otras ramas → Preview deployments con URL temporal

---

## 🎨 Paso 5: Personalizar Dominio (Opcional)

1. **En Settings → Domains:**
   - Agrega un dominio personalizado mejor:
     - `devmanager-frontend.vercel.app`
     - `devmanager-farit.vercel.app`

2. **El dominio anterior seguirá funcionando** pero el nuevo será el principal

---

## ✅ Verificación Final

Después de configurar, verifica:

1. ✅ Un solo proyecto en Vercel dashboard
2. ✅ GitHub repo conectado (verás el ícono de GitHub)
3. ✅ Variables de entorno configuradas
4. ✅ Haz un push de prueba:
   
   ```bash
   # Cambio pequeño
   echo "# Test auto-deploy" >> README.md
   git add README.md
   git commit -m "test: verify auto-deploy"
   git push origin Farit_DevMag
   ```

5. ✅ Ve a Vercel → Deployments y verás el nuevo deploy iniciando automáticamente

---

## 🐛 Solución de Problemas

### "Repository not found"
- El repo es privado → Pide al owner (Ewin24) que instale Vercel GitHub App
- O haz el repo público temporalmente

### "No se dispara el auto-deploy"
- Verifica que la rama configurada en Vercel coincide con la que usas
- Revisa Settings → Git → Production Branch

### "Múltiples deployments"
- Elimina proyectos duplicados
- Guarda solo uno conectado a GitHub

---

## 📊 Resultado Final

✅ **Un solo dominio oficial**
✅ **Auto-deploy en cada push**
✅ **No más `vercel` CLI necesario**
✅ **Trabajo desde cualquier máquina sin problemas**
✅ **Historial de deploys visible**

---

## 🚀 Comando para eliminar proyecto local de Vercel

Si quieres limpiar la configuración local de Vercel:

```bash
# Elimina la carpeta .vercel (configuración local)
Remove-Item -Recurse -Force .vercel
```

Esto no afecta el proyecto en Vercel, solo limpia la config local.
