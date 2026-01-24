# 🚀 AutoTech Training - Frontend

## 📦 ARCHIVOS INCLUIDOS

```
autotech-frontend/
├── public/
│   └── index.html          ← HTML base
├── src/
│   ├── App.jsx             ← Componente principal (toda la app)
│   ├── index.js            ← Punto de entrada de React
│   └── index.css           ← Estilos CSS
├── package.json            ← Dependencias (React, lucide-react)
├── .env.example            ← Template de variables de entorno
├── .gitignore              ← Archivos a ignorar en Git
└── README.md               ← Este archivo
```

---

## ⚡ PASOS RÁPIDOS

### 1. Descomprimir
Descomprime este ZIP en tu escritorio.

### 2. Subir a GitHub

Abre PowerShell en la carpeta descomprimida y ejecuta:

```bash
# Navega a la carpeta (ajusta la ruta si es necesario)
cd C:\Users\18041\Desktop\autotech-frontend

# Inicializa Git
git init

# Agrega archivos
git add .

# Commit
git commit -m "Initial frontend setup"

# Conecta con tu repositorio (usa TU URL)
git remote add origin https://github.com/18041987op/autotech-training-frontend

# Sube
git branch -M main
git push -u origin main --force
```

### 3. Crear archivo .env

**IMPORTANTE:** Antes de desplegar en Vercel, crea un archivo `.env` (sin el .example) y agrega:

```
REACT_APP_API_URL=https://tu-backend.onrender.com
```

Cambia `https://tu-backend.onrender.com` por la URL real de tu backend en Render.

---

## 🎯 SIGUIENTE PASO

Una vez subido a GitHub, continúa con el **Paso 3** de la guía principal:
- Configurar Supabase
- Desplegar backend en Render
- Desplegar frontend en Vercel

---

## 📝 NOTAS

- Este es un proyecto de React creado con Create React App
- Usa Lucide React para los iconos
- Se conecta al backend mediante la variable REACT_APP_API_URL
- El archivo .gitignore protege información sensible

---

## ✅ VERIFICACIÓN

Después de subir a GitHub, verifica que estos archivos estén en:
`https://github.com/18041987op/autotech-training-frontend`

- ✅ package.json
- ✅ src/App.jsx
- ✅ src/index.js
- ✅ public/index.html
- ✅ .gitignore
- ✅ .env.example

**¿Listo?** Ejecuta los comandos de arriba y continúa con la guía principal. 🚀
