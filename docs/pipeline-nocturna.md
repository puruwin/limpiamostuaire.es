# Pipeline nocturna

Claude desarrolla issues de noche, una detrás de otra, y las fusiona en `staging` si pasan el gate. Por la mañana David revisa la preview de staging y el resumen, y es el único que aprueba `staging` → `main`.

## Qué hace cada noche

1. **00:00 (Madrid, invierno)**: arranca `.github/workflows/noche.yml`.
2. **Comprueba el gate.** Si en `staging` falta alguno de los scripts de `requiredScripts`, no hace nada y lo anota.
3. **Elige la siguiente issue** (`scripts/pipeline/elegir.mjs`): abierta, creada por `puruwin`, con código `Mx.y` en el título, sin etiquetas excluidas, fuera de `M0` y de `excludedCodes`, y con todas sus dependencias (línea «Depende de:») cerradas. Va por orden de milestone y código.
4. **Claude la implementa** (`trabajar.sh` + `prompt.md`) en el runner de GitHub, sin token de GitHub: no puede hacer push, fusionar ni tocar issues.
5. **Gate** (`gate.mjs`): falla si se tocan rutas protegidas, si se borran tests o si no hay cambios, y después ejecuta en orden los comandos de `gate`. Lighthouse se pasa sobre todas las páginas de `dist/`, no sobre una lista fija, con un mínimo de 95 en las cuatro categorías.
6. **Si falla**, Claude recibe el final del registro y lo intenta otra vez. Si falla dos veces, la issue se etiqueta `auto:bloqueada` y se comenta el error. Sus dependientes quedan fuera solas, porque su dependencia sigue abierta.
7. **Si pasa**, se abre un PR contra `staging`, se fusiona (squash), se cierra la issue con `en-staging` y se lanza la siguiente ejecución sobre el `staging` ya actualizado.
8. **Si Claude ve que necesita algo de David**, no hace la issue a medias: la etiqueta `auto:necesita-david` y explica qué falta.
9. Para a las 05:00 UTC, al llegar al límite de uso de Claude o al superar `weeklyBudgetUsd` (coste equivalente de los últimos 7 días; es la aproximación al 90 % del uso semanal, porque Claude Code no expone ese porcentaje a scripts). `maxIssuesPerNight` es opcional.
10. **07:00**: el resumen se escribe en la issue «Noche AAAA-MM-DD», que se asigna a David (le llega el aviso entonces, no de madrugada), y se lanza el despliegue de staging (`deploy.yml` o `ci.yml` con `workflow_dispatch`), porque los push hechos con `GITHUB_TOKEN` no disparan workflows.

## Qué hace David

- **Cada mañana:** leer la issue «Noche …», mirar la preview y aprobar el PR `staging` → `main` cuando esté bien.
- **Si algo no le convence:** reabrir la issue, quitar `en-staging` y comentar qué cambiar. Esa noche vuelve a la cola.
- **Para reintentar una bloqueada:** quitar `auto:bloqueada` o `auto:necesita-david`.
- **Para lanzar una issue concreta:** Actions → Noche → Run workflow → número de issue (no encadena).

## Activarla

1. Fusionar este PR en `main` y crear `staging` desde `main` (si no existe).
2. Hacer de día, con revisión, M1.1, M1.5 y M1.8: son los que definen el gate.
3. Elegir **un** secreto de Anthropic en Settings → Secrets and variables → Actions:
   - `CLAUDE_CODE_OAUTH_TOKEN`: sale de `claude setup-token` y gasta de tu suscripción Pro/Max. Con Pro, la noche comparte cuota con lo que uses de día; si se llega al límite, la noche se para sin etiquetar la issue (⏸️ en el resumen) y sigue al día siguiente.
   - o `ANTHROPIC_API_KEY`: pago por uso. En ese caso pon también `NOCHE_PRESUPUESTO_USD` (p. ej. `5`, por intento).
4. Variables del repositorio:
   - `NOCHE_ACTIVA=true`: el interruptor. Sin ella no corre nada.
   - `NOCHE_MODELO` (opcional, por defecto `sonnet`): alias del modelo.
   - `STAGING_URL` (opcional): sale en el resumen.
5. Settings → Actions → General → Workflow permissions: «Read and write» y «Allow GitHub Actions to create and approve pull requests».
6. Protección de `main`: exigir PR, el CI en verde y tu aprobación. `staging` no se protege: la pipeline fusiona con `GITHUB_TOKEN`.

## Lo que este diseño no cubre

- **El gate decide solo.** Si los checks son flojos, se fusionará código malo sin que nadie lo vea. Cada fallo que encuentres en staging debería acabar en un check nuevo, no solo en un arreglo.
- **El gate no valida el contenido.** Que un texto sea bueno, cierto y convierta solo lo ve David en la preview. Por eso el prompt prohíbe inventar datos del negocio.
- **El aislamiento es parcial.** Claude no tiene el token de GitHub, pero sí la clave de Anthropic y red, y puede ejecutar `node`. La lista de herramientas permitidas limita errores, no a un atacante. Por eso solo se leen issues escritas por `owner`, nunca comentarios.
- **Las rutas protegidas se comprueban por diff.** Los scripts de la pipeline se toman siempre de `main`, así que una rama no puede cambiar su propio gate.

## Reutilizar en otra web

Copiar `.github/workflows/noche.yml`, `.github/workflows/pipeline-tests.yml`, `scripts/pipeline/` y `pipeline.config.json`, y ajustar `owner`, `requiredScripts`, `gate`, `excludedCodes` y las rutas protegidas. Las issues necesitan código `Mx.y` en el título y la línea «Depende de: …» en el cuerpo, como las que genera `crear_issues.py`.
