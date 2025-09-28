# PresuPWA

Aplicación PWA mobile-first para gestionar presupuesto personal en Chile. Está construida con React + TypeScript + Vite, TailwindCSS, Dexie (IndexedDB) y funciona completamente offline con sincronización diferida.

## Requisitos

- Node.js 18+
- npm o pnpm

## Instalación

```bash
npm install
npm run dev
```

La app se sirve en `http://localhost:5173`. Puedes instalarla como PWA desde el navegador y funciona offline gracias al Service Worker cache-first.

## Scripts

- `npm run dev` – entorno de desarrollo Vite.
- `npm run build` – compila la app y el Service Worker.
- `npm run postbuild` – se ejecuta tras `npm run build` y duplica `dist/index.html` como `dist/404.html`.
- `npm run preview` – previsualiza el build.
- `npm run test` – ejecuta pruebas unitarias y de accesibilidad con Vitest y Testing Library.

## Características clave

- Captura rápida de movimientos con numpad, autocompletado de comerciantes y reglas de categorización.
- Gestión de suscripciones con normalización a valor mensual, recordatorios (stub Web Push) y registro de cobros.
- Obligaciones indexadas por IPC con cálculo automático del monto ajustado y generación de movimientos.
- Panel de KPIs con tasa de ahorro, DTI, hormigas y comparativas de gasto.
- Importación/exportación local-first con File System Access API y fallback `<input type="file">`.
- Cola de reintentos IndexedDB sin Background Sync y soporte para share target de texto/imágenes.
- Dark mode por defecto, accesibilidad con roles ARIA, atajos y foco visible.

## Limitaciones iOS

Safari iOS no soporta File System Access API ni Background Sync. La cola de reintentos se limpia al reabrir la app y se recomienda fijar la PWA en pantalla de inicio para un mejor soporte offline.

## Seeds y datos iniciales

Al iniciar por primera vez se insertan movimientos, suscripciones, obligaciones, índices IPC y reglas de comerciantes para explorar todas las vistas.

## Notas sobre PWA

- `manifest.webmanifest` incluye `share_target` y start URL `/capturar`.
- El Service Worker cachea el app shell y guarda peticiones fallidas en IndexedDB para reintentos posteriores.
- Las funciones de Web Push y actualización automática de IPC incluyen `// TODO` para integrar APIs reales.

## Testing

Las pruebas cubren helpers de formato, IPC, reglas de hormigas y flujos de accesibilidad básicos en la pantalla de captura rápida.

## Despliegue en GitHub Pages

GitHub Pages utiliza el archivo `404.html` para servir rutas profundas en aplicaciones SPA. El script de postbuild copia el contenido de `dist/index.html` en `dist/404.html` para que cualquier ruta renderice correctamente la aplicación.
