# limpiamostuaire.es

Web de «Limpiamos tu aire»: limpieza en profundidad de aires acondicionados. Operador en Benidorm: Ti&Di.

Sitio estático en español e inglés hecho con [Astro](https://astro.build), TypeScript strict y Tailwind CSS. El plan está en las issues y milestones del repositorio; la identidad visual, en [`DESIGN.md`](DESIGN.md).

## Requisitos

- Node 24 (versión fijada en `.node-version`; Astro exige ≥ 22.23.4).
- npm.

## Comandos

| Comando                | Qué hace                                                       |
| ---------------------- | -------------------------------------------------------------- |
| `npm ci`               | Instala las dependencias exactas de `package-lock.json`        |
| `npm run dev`          | Servidor de desarrollo en `http://localhost:4321/`             |
| `npm run build`        | Genera el sitio estático en `dist/`                            |
| `npm run preview`      | Sirve `dist/` en local para revisarlo                          |
| `npm run check`        | Tipos de Astro y TypeScript (`astro check`), claves de `ui.ts` |
| `npm test`             | Tests con `node --test` (`src/**/*.test.ts`)                   |
| `npm run check:robots` | Meta robots de `dist/` según `SITE_ENV`                        |
| `npm run check:csp`    | CSP de cada página de `dist/`: hashes, sin `unsafe-inline`     |
| `npm run check:caddy`  | `deploy/Caddyfile` con Caddy real: cabeceras, caché y 301      |
| `npm run lint`         | ESLint (TypeScript, Astro y accesibilidad)                     |
| `npm run format`       | Formatea con Prettier (incluye el orden de clases de Tailwind) |
| `npm run format:check` | Comprueba el formato sin tocar ficheros                        |

Los `check:*` van después de `npm run build`. `check:caddy` necesita el binario de Caddy (`caddy` en el `PATH` o `CADDY=/ruta/caddy`).

El CI (`.github/workflows/ci.yml`) ejecuta todo lo anterior en cada PR y en cada push a `main`, y despliega: cada PR en `staging.limpiamostuaire.es` (con contraseña) y `main` en `limpiamostuaire.es`. Antes de abrir un PR, pásalos en local.

Solo `SITE_ENV=production` genera páginas indexables; sin variable, el build lleva `noindex`. Hasta el lanzamiento (M5.2), `main` se construye con `provisional`. Detalles, cabeceras de seguridad y puesta en marcha del VPS: [`docs/despliegue.md`](docs/despliegue.md).

## Estructura

```text
astro.config.mjs           site, trailingSlash 'always', build.format 'directory', i18n, fuente Figtree, SITE_ENV y CSP
src/
  content.config.ts        Esquema de la colección pages
  content/pages/es/, en/   Un Markdown por página e idioma
  i18n/locales.ts          Idiomas: es en la raíz, en en /en/
  i18n/ui.ts               Cadenas de interfaz de los 2 idiomas
  layouts/BaseLayout.astro Esqueleto HTML común: fuente, favicon, robots, salto al contenido y <main>
  integrations/            Guarda de {{PENDIENTE sobre dist/ en producción
  lib/pages.ts             URL de cada página y validación de la colección
  lib/pendientes.ts        Búsqueda de {{PENDIENTE en un directorio
  lib/site-env.ts          SITE_ENV e isIndexable
  pages/[...path].astro    Ruta dinámica que genera todas las páginas de la colección
  templates/               Plantillas de página (campo template)
  styles/global.css        Entrada de Tailwind con los colores de DESIGN.md
public/                    Ficheros que se copian tal cual a dist/ (favicon)
scripts/                   Comprobaciones check:* sobre dist/ y deploy/
deploy/Caddyfile           Sitios de producción, www y staging en el VPS
brand/                     Logos y fuentes (ver DESIGN.md)
docs/                      Negocio, SEO y decisiones
```

## Cadenas de interfaz

`src/i18n/ui.ts` tiene un objeto por idioma. `es` define las claves y `en` tiene que tener exactamente las mismas: si falta o sobra una, `npm run check` falla (y `npm test` también). En los componentes:

```astro
---
import { useTranslations } from "../i18n/ui";
const t = useTranslations("es");
---

<a href="#contenido">{t("a11y.skipToContent")}</a>
```

## Añadir una página en los 2 idiomas

Cada página es un Markdown en `src/content/pages/<locale>/` y `src/pages/[...path].astro` las genera todas; no se crean `.astro` en `src/pages/`.

```md
---
locale: es # es | en; tiene que coincidir con la carpeta
translationKey: precios # igual en la versión de cada idioma
slug: precios # sin barras; "" para la home. La URL sale de aquí: /precios/, /en/prices/
title: Precios de limpieza de aire acondicionado | Limpiamos tu aire
description: …
h1: Precios
template: basica # plantilla de src/templates/
draft: false # opcional; true = borrador
updated: 2026-11-25
---

Cuerpo en Markdown.
```

1. Crea `src/content/pages/es/<nombre>.md` y `src/content/pages/en/<nombre>.md` con el mismo `translationKey` y el `slug` traducido. El nombre del fichero no afecta a la URL.
2. Para una plantilla nueva, crea `src/templates/<Nombre>.astro` (recibe `page` y el cuerpo por `<slot />`), añádela al `z.enum` de `template` en `src/content.config.ts` y al mapa `templates` de `src/pages/[...path].astro`.
3. Si la página necesita textos de interfaz nuevos, añade la clave a `es` y a `en` en `src/i18n/ui.ts`.
4. `npm run check && npm run build`.

El build falla en cualquier entorno si dos páginas del mismo idioma comparten ruta o `translationKey`, o si el `locale` no coincide con la carpeta. Un campo que falte o no cumpla el esquema también.

## Guardas de producción

Con `SITE_ENV=production` (y solo entonces), `npm run build` falla si:

- alguna página tiene `draft: true` (lo comprueba la ruta dinámica);
- queda un `{{PENDIENTE` en cualquier fichero de `dist/`, HTML o no (integración `src/integrations/production-guards.ts`, al final del build). El error da fichero y línea.

Para marcar un texto que falta, escribe `{{PENDIENTE: lo que falta}}`. En staging, `provisional` y local los borradores se generan y los huecos se publican, para revisarlos; el día del lanzamiento (M5.2) bloquean el despliegue. Para probarlo en local: `SITE_ENV=production npm run build`.
