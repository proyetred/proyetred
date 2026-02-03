# PRØYET_RED
Nuestros Fundadores
David Martinez • Alexander Blanco • Angel Padilla
AuroraWeb Alpha v0.1
© 2025 PRØYET_RED. Todos los derechos reservados.

## Nota de despliegue (Assets minificados)

Para producción recomendamos servir las versiones minificadas de CSS y JS. He añadido un script de minificación simple en:

- `tools/minify_assets.ps1` (PowerShell)

Uso básico desde la raíz del proyecto:

```powershell
.\tools\minify_assets.ps1
```

Esto generará `styles.min.css` y `script.min.js` en la raíz. Los archivos HTML ya han sido actualizados para referenciar las versiones `.min`.

Revisa los archivos generados antes de desplegar; el minificador es intencionalmente simple y puede necesitar ajustes para proyectos más grandes.

Si prefieres que lo haga automáticamente como parte de un flujo de build (npm, gulp, etc.), puedo añadir una configuración de build opcional.

### Integración con npm (opcional)

He añadido un `package.json` con scripts básicos para minificar usando herramientas comunes:

- Dependencias de desarrollo: `terser`, `clean-css-cli`.
- Script de build: `npm run build` (ejecuta minificación y genera `script.min.js` y `styles.min.css`).

Pasos para usar (si tienes Node.js/npm instalado):

```powershell
npm install
npm run build
```

Esto generará los archivos `.min` (siempre revisa los resultados antes de desplegar).
