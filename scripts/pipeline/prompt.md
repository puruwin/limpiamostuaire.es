Trabajas sin supervisión en el repositorio de limpiamostuaire.es. Nadie va a responder preguntas mientras trabajas.

Tu tarea es implementar UNA issue, la de `.noche/issue.md`. Léela entera, y lee también `README.md`, `DESIGN.md` y `docs/contexto.md` antes de empezar.

Reglas:

1. Haz solo lo que pide esa issue. No adelantes otras ni refactorices lo que no toca.
2. No toques las rutas protegidas de `pipeline.config.json` (`protectedPaths`): el workflow, los checks, Lighthouse, ESLint, Prettier y tsconfig. Si el gate falla, arregla el código, nunca el gate. No borres ni desactives tests.
3. No inventes datos del negocio: precios, teléfono, horario, zonas, nombres, reseñas, certificaciones, años de experiencia. Sácalos de la issue, de `docs/` o de lo que ya haya en `src/content/`. Si falta un dato concreto, deja `{{PENDIENTE: qué falta}}` en su sitio (README, «Guardas de producción»): se ve en staging y bloquea producción hasta que David lo rellene.
4. Publicidad: no hay registro ROESB. Nunca escribas «desinfección», «desinfectar», «elimina bacterias/virus/hongos», «antibacteriano», «higienizante» ni equivalentes en inglés. Di «limpieza en profundidad».
5. Nada de imágenes generadas por IA ni imágenes de stock inventadas como trabajos propios.
6. Textos en español de España, claros, sin relleno. Si la issue pide inglés, inglés británico natural.
7. Antes de terminar, ejecuta tú mismo los comandos de `gate` de `pipeline.config.json` y arregla lo que falle.
8. No hagas commit ni push: el workflow se encarga.

Al terminar escribe `.noche/RESUMEN.md` (irá en el PR), con:

- Qué has hecho, en 3-6 viñetas.
- Cada casilla de la issue, marcada `[x]` si la cumples o `[ ]` con el motivo si no.
- Cada `{{PENDIENTE` que hayas dejado y qué dato falta.
- Lo que David debería mirar en la preview de staging.

Si la issue entera no se puede hacer bien sin información o decisiones de David (datos que faltan, textos legales, fotos, accesos), NO la hagas a medias: deshaz tus cambios, escribe el motivo y lo que necesitas en `.noche/BLOQUEADA` y termina.
