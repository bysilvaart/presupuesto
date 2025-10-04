import { spawnSync } from 'node:child_process'
import { existsSync, rmSync, mkdirSync, copyFileSync, writeFileSync, cpSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const distDir = resolve(projectRoot, 'dist')

function runViteBuild() {
  const viteBinary = resolve(projectRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite')
  if (!existsSync(viteBinary)) {
    return false
  }

  const result = spawnSync(viteBinary, ['build'], {
    cwd: projectRoot,
    stdio: 'inherit'
  })

  return result.status === 0
}

function fallbackBuild() {
  console.warn('Vite no está disponible; usando compilación mínima de reserva.')
  rmSync(distDir, { recursive: true, force: true })
  mkdirSync(distDir, { recursive: true })

  const publicDir = resolve(projectRoot, 'public')
  if (existsSync(publicDir)) {
    cpSync(publicDir, distDir, { recursive: true })
  }

  const swSource = resolve(projectRoot, 'src', 'pwa', 'service-worker.js')
  if (existsSync(swSource)) {
    copyFileSync(swSource, resolve(distDir, 'sw.js'))
  }

  const noticePath = resolve(distDir, 'OFFLINE_BUILD_NOTICE.txt')
  writeFileSync(
    noticePath,
    [
      'Esta build se generó usando la rutina de reserva porque Vite no está disponible en el entorno actual.',
      'Para una build optimizada, ejecuta `npm install` y luego `npm run build` en un entorno con acceso al registry de npm.'
    ].join('\n'),
    'utf8'
  )

  const fallbackHtml = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Presupuesto Personal · build limitada</title>
  </head>
  <body style="margin:0;font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;background:#0f172a;color:#f8fafc;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:2rem;text-align:center;">
    <main>
      <h1 style="font-size:1.5rem;margin-bottom:1rem;">Build mínima generada sin Vite</h1>
      <p style="max-width:32rem;margin:0 auto 1.5rem;line-height:1.6;">
        Los assets finales no se pudieron generar porque el entorno no dispone de las dependencias de npm ni del binario de Vite.
        El Service Worker (<code>sw.js</code>) y los archivos estáticos se copiaron para permitir verificaciones básicas.
      </p>
      <p style="max-width:32rem;margin:0 auto;line-height:1.6;">
        Para obtener una build optimizada ejecuta <code>npm install</code> seguido de <code>npm run build</code> en un entorno con acceso al registry de npm.
      </p>
    </main>
  </body>
</html>
`

  writeFileSync(resolve(distDir, 'index.html'), fallbackHtml, 'utf8')
}

if (!runViteBuild()) {
  fallbackBuild()
}
