# 🚀 Guía de Despliegue - DevManager Frontend

Este documento explica cómo publicar DevManager Frontend para acceso global.

## 📋 Prerequisitos

Antes de desplegar, asegúrate de tener:
- Cuenta en la plataforma de deployment elegida
- Variables de entorno configuradas (ver `.env`)
- Código actualizado en GitHub (recomendado)

## ⚡ Opción 1: Vercel (Recomendada - Más rápida)

### Despliegue desde Git (Recomendado)

1. **Sube tu código a GitHub** (si no lo has hecho):
   ```bash
   git add .
   git commit -m "feat: add reports dashboard, user profiles, settings, and refactor project detail"
   git push origin main
   ```

2. **Ve a [vercel.com](https://vercel.com)**

3. **Importa tu proyecto:**
   - Click en "Add New" → "Project"
   - Conecta tu repositorio de GitHub
   - Selecciona el repositorio `DevManagerFront`

4. **Configura variables de entorno:**
   - En "Environment Variables" agrega:
     - `VITE_API_URL` → URL de tu backend (ej: `https://tu-backend.com`)
     - `VITE_GEMINI_API_KEY` → Tu API key de Google Gemini

5. **Deploy:**
   - Click en "Deploy"
   - Vercel automáticamente detecta Vite y construye el proyecto
   - ✅ Tu app estará disponible en `https://tu-proyecto.vercel.app`

### Despliegue con CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy a producción
vercel --prod
```

---

## 🌐 Opción 2: Netlify

### Despliegue desde Git

1. **Sube tu código a GitHub**

2. **Ve a [netlify.com](https://netlify.com)**

3. **Importa proyecto:**
   - Click en "Add new site" → "Import an existing project"
   - Conecta GitHub y selecciona tu repositorio

4. **Configuración de build:**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - El archivo `netlify.toml` ya está configurado ✅

5. **Variables de entorno:**
   - En "Site settings" → "Environment variables"
   - Agrega `VITE_API_URL` y `VITE_GEMINI_API_KEY`

6. **Deploy automático** cada vez que hagas push a `main`

### Despliegue con CLI

```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy

# Deploy a producción
netlify deploy --prod
```

---

## 📦 Opción 3: GitHub Pages (Gratis)

### Configuración

1. **Actualiza `vite.config.ts`:**
   ```typescript
   export default defineConfig(({ mode }) => {
       return {
           base: '/DevManagerFront/', // Nombre de tu repo
           // ... resto de config
       };
   });
   ```

2. **Instala gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

3. **Agrega scripts en `package.json`:**
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

4. **Deploy:**
   ```bash
   npm run deploy
   ```

5. **Configura GitHub Pages:**
   - Ve a Settings → Pages
   - Source: Deploy from branch `gh-pages`
   - ✅ Disponible en `https://tu-usuario.github.io/DevManagerFront/`

---

## 🔒 Configuración de Variables de Entorno

### Variables requeridas:

```env
VITE_API_URL=https://tu-backend.com
VITE_GEMINI_API_KEY=tu-api-key-aqui
```

**IMPORTANTE:** 
- Nunca commits el archivo `.env` a Git
- Configura las variables en la plataforma de deployment
- En desarrollo usa `.env.local`

---

## 🔍 Verificación Post-Deploy

Después de desplegar, verifica:

1. ✅ La app carga correctamente
2. ✅ Las rutas funcionan (ej: `/dashboard`, `/projects`)
3. ✅ La conexión al backend funciona
4. ✅ Las funciones IA de Gemini responden
5. ✅ El tema oscuro/claro cambia correctamente

---

## 🐛 Solución de Problemas

### Rutas 404 en producción
- **Vercel:** El archivo `vercel.json` ya está configurado ✅
- **Netlify:** El archivo `netlify.toml` ya está configurado ✅
- **Otros:** Asegúrate de tener rewrites para SPA

### Build falla
```bash
# Limpia caché y reconstruye
rm -rf node_modules dist
npm install
npm run build
```

### Variables de entorno no funcionan
- Asegúrate que empiezan con `VITE_`
- Reinicia el servidor/redeploy después de agregarlas

---

## 📊 Recomendación Final

**Para proyectos de producción:** Vercel
- ✅ Setup más rápido
- ✅ Deploys automáticos desde Git
- ✅ SSL gratis
- ✅ CDN global
- ✅ Preview deployments en cada PR

**Para proyectos educativos/personales:** GitHub Pages
- ✅ Completamente gratis
- ✅ Hosting ilimitado
- ✅ Fácil de configurar

---

## 🚀 Deploy Rápido (Vercel CLI)

```bash
# Un solo comando
npm i -g vercel && vercel --prod
```

Después configura las variables de entorno en el dashboard de Vercel.
