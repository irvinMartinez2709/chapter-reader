# CHAPTER

Convertidor de documentos a flipbooks interactivos con efecto de giro de página realista.

## Características

- **Conversión client-side**: No necesita servidor. Todo se procesa en el navegador.
- **Múltiples formatos**: PDF, Word (.docx), PowerPoint (.pptx), imágenes (JPG, PNG, WebP, GIF)
- **Efecto de giro realista**: Usa StPageFlip para animaciones 3D de giro de página
- **Editor básico**: Personaliza portada y título del flipbook
- **Lectura offline**: Los flipbooks se guardan localmente en IndexedDB
- **Tema claro/oscuro**: Se adapta al tema del sistema o se puede cambiar manualmente
- **Mobile-first**: Diseñado para funcionar en dispositivos móviles

## Tech Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Flipbook**: StPageFlip (page-flip)
- **Conversión PDF**: pdf.js (client-side)
- **Conversión DOCX**: mammoth.js + html2canvas
- **Extracción PPTX**: JSZip
- **Almacenamiento**: IndexedDB via localforage
- **Android**: Capacitor v6

## Desarrollo

### Requisitos
- Node.js 20+
- npm

### Instalación

```bash
cd web
npm install
```

### Desarrollo web

```bash
npm run dev
```

### Build para producción

```bash
npm run build
```

### Build APK (requiere Android SDK)

```bash
# Agregar plataforma Android
npx cap add android

# Sincronizar
npx cap sync android

# Build APK
cd android
./gradlew assembleDebug
```

## GitHub Actions

El workflow `.github/workflows/build-android.yml` construye automáticamente el APK cuando se hace push a `main`.

### Para usar el workflow:

1. Crear un repositorio en GitHub
2. Subir el código
3. El workflow se ejecutará automáticamente y creará una Release con el APK

## Estructura del proyecto

```
FLIPPDF/
├── web/                    # Aplicación web
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   │   ├── Converter/  # Lógica de conversión
│   │   │   ├── Editor/     # Editor de flipbooks
│   │   │   ├── FileUploader/ # Selector de archivos
│   │   │   ├── FlipBookViewer/ # Visor flipbook
│   │   │   ├── Library/    # Biblioteca de libros
│   │   │   ├── SplashScreen/ # Pantalla de inicio
│   │   │   └── ThemeToggle/ # Toggle de tema
│   │   ├── hooks/          # Hooks personalizados
│   │   ├── i18n/           # Traducciones
│   │   ├── pages/          # Páginas
│   │   ├── types/          # Tipos TypeScript
│   │   └── utils/          # Utilidades
│   │       ├── storage.ts  # IndexedDB
│   │       ├── pdfConverter.ts
│   │       ├── docxConverter.ts
│   │       ├── pptxConverter.ts
│   │       └── imageConverter.ts
│   └── package.json
├── .github/workflows/      # CI/CD
└── logs/                   # Logs de desarrollo
```

## Licencia

MIT
