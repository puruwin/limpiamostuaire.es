# Desarrollo autónomo

Claude resuelve issues una detrás de otra, sin supervisión, y fusiona en `staging` las que pasan el gate. Sigue hasta que hay un bloqueo importante o David lo apaga. Cada mañana deja un resumen, y solo David aprueba `staging` → `main`.

## Cómo funciona

1. **Arranque:** a mano (Actions → Desarrollo autónomo → Run workflow) o con el cron, que lo reintenta cada 2 horas por si la cadena se paró por el límite de uso o porque no quedaban issues.
2. **Comprueba el gate.** Si en `staging` falta alguno de los scripts de `requiredScripts`, no hace nada y lo anota.
3. **Elige la siguiente issue** (`scripts/pipeline/elegir.mjs`): abierta, creada por `puruwin`, con código `Mx.y` en el título, sin etiquetas excluidas, fuera de `M0` y de `excludedCodes`, y con todas sus dependencias (línea «Depende de:») cerradas. Va por orden de milestone y código.
4. **Claude la implementa** (`trabajar.sh` + `prompt.md`) en el runner de GitHub, sin token de GitHub: no puede hacer push, fusionar ni tocar issues.
5. **Gate** (`gate.mjs`): falla si se tocan rutas protegidas, si se borran tests o si no hay cambios. Después ejecuta en orden los comandos de `gate`. Lighthouse se pasa sobre todas las páginas de `dist/`, con un mínimo de 95 en las cuatro categorías.
6. **Si falla**, Claude recibe el final del registro y lo intenta otra vez. Si vuelve a fallar, la issue se etiqueta `auto:bloqueada`, se comenta el error y se pasa a la siguiente. Sus dependientes se quedan fuera solas.
7. **Si pasa**, se abre un PR contra `staging`, se fusiona (squash), se cierra la issue con `en-staging` y se encadena la siguiente ejecución sobre el `staging` ya actualizado.
8. **Si Claude necesita algo de David**, no hace la issue a medias: la etiqueta `auto:necesita-david` y explica qué falta.

## Cuándo se para

| Motivo | Qué pasa | Cómo sigue |
|---|---|---|
| `AUTO_ACTIVO` distinto de `true` | Termina la issue en curso y no encadena más | Volver a ponerla a `true` |
| Límite de uso de la suscripción | ⏸️ en el registro. La issue no se etiqueta | El cron lo reintenta cada 2 h |
| `weeklyBudgetUsd` superado (opcional) | ⏸️ en el registro | Al bajar el gasto de los últimos 7 días |
| No quedan issues elegibles | 🌙 con la lista de descartadas | El cron lo reintenta. Cierra issues de M0 para desbloquear |
| 3 fallos de gate seguidos (`stopAfterConsecutiveFailures`) | 🛑. Suele ser algo roto en staging o en el gate | Solo a mano, tras revisar |
| Falta el gate | ⛔ | Hacer M1.1, M1.5 y M1.8 |

Para pararlo ya, cancela la ejecución en curso en Actions y pon `AUTO_ACTIVO=false`.

## Qué hace David

- **Cada mañana:** leer la issue «Registro AAAA-MM-DD» (se te asigna a las 7:00), mirar la preview y aprobar el PR `staging` → `main` cuando esté bien.
- **Si algo no le convence:** reabrir la issue, quitar `en-staging` y comentar qué cambiar. Vuelve a la cola.
- **Para reintentar una bloqueada:** quitar `auto:bloqueada` o `auto:necesita-david`.
- **Para lanzar una issue concreta:** Run workflow con el número de issue (no encadena).

## Activarlo

1. Fusionar este PR en `main`. `staging` ya existe.
2. Hacer de día, con revisión, M1.1, M1.5 y M1.8, que son los que definen el gate.
3. Secreto en Settings → Secrets and variables → Actions:
   - `CLAUDE_CODE_OAUTH_TOKEN`: sale de `claude setup-token` y gasta de tu suscripción. Con Pro comparte cuota con lo que uses tú.
   - o `ANTHROPIC_API_KEY`: pago por uso. Pon también `AUTO_PRESUPUESTO_USD` (tope por intento).
4. Variables del repositorio:
   - `AUTO_ACTIVO=true`: el interruptor.
   - `AUTO_MODELO` (opcional, por defecto `sonnet`).
   - `STAGING_URL` (opcional): sale en el resumen.
5. Settings → Actions → General → Workflow permissions: «Read and write» y «Allow GitHub Actions to create and approve pull requests».
6. Protección de `main`: exigir PR, el CI en verde y tu aprobación. `staging` no se protege, porque la pipeline fusiona con `GITHUB_TOKEN`.

## Cuota

Claude Code no expone a scripts el porcentaje de uso semanal: `/usage` es interactivo. `weeklyBudgetUsd` es la aproximación. Cada ejecución apunta `[coste:x]` (el coste equivalente que informa Claude Code) en el registro, y antes de empezar se suma lo de los últimos 7 días. Se calibra comparando ese total con `/usage` tras unos días.

## Lo que este diseño no cubre

- **El gate decide solo.** Si los checks son flojos, se fusiona código malo. Cada fallo que encuentres en staging debería acabar en un check nuevo, no solo en un arreglo.
- **El gate no valida el contenido.** Que un texto sea bueno, cierto y convierta solo lo ves tú en la preview. Por eso el prompt prohíbe inventar datos del negocio.
- **El aislamiento es parcial.** Claude no tiene el token de GitHub, pero sí la clave de Anthropic, red y `node`. La lista de herramientas limita errores, no a un atacante. Por eso solo se leen issues escritas por `owner`, nunca comentarios.
- **Rutas protegidas por diff.** Los scripts de la pipeline se toman siempre de `main`: una rama no puede cambiar su propio gate.

## Reutilizar en otra web

Copiar `.github/workflows/autonomo.yml`, `.github/workflows/pipeline-tests.yml`, `scripts/pipeline/` y `pipeline.config.json`, y ajustar `owner`, `requiredScripts`, `gate`, `excludedCodes` y las rutas protegidas. Las issues necesitan código `Mx.y` en el título y la línea «Depende de: …» en el cuerpo, como las que genera `crear_issues.py`.
