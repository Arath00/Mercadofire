# MiniSuper - Sistema de Inventario

Sistema completo de gestión de inventario para minisuper desarrollado con React, TypeScript, Tailwind CSS y Firebase.

## Características

- 🔐 Autenticación con Firebase
- 📦 Gestión de productos y categorías
- 📊 Control de inventario (entradas y salidas)
- 📈 Reportes y análisis
- 📱 Diseño responsive
- 🌐 Soporte multiidioma (Español/Inglés)

## Tecnologías

- React 18
- TypeScript
- Tailwind CSS
- Firebase Authentication
- Recharts para gráficos
- React Router DOM
- Lucide React para iconos

## Instalación

1. Clona el repositorio
2. Instala las dependencias: `npm install`
3. Configura Firebase en `src/firebase.js`
4. Ejecuta el proyecto: `npm run dev`

## Funcionalidades

### Autenticación
- Registro de usuarios
- Inicio de sesión
- Protección de rutas

### Gestión de Inventario
- Categorías de productos
- Productos con imágenes
- Control de stock mínimo
- Transacciones de entrada y salida

### Reportes
- Métodos de valuación (PEPS, UEPS, Promedio Ponderado)
- Análisis de costos
- Gráficos y estadísticas

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
├── contexts/           # Contextos de React
├── pages/              # Páginas principales
├── firebase.js         # Configuración de Firebase
└── main.tsx           # Punto de entrada
```

## Licencia

MIT License