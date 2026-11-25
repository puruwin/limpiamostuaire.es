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
  i18n/locales.ts          Idiomas: es en la raíz, en en /en/
  i18n/ui.ts               Cadenas de interfaz de los 2 idiomas
  layouts/BaseLayout.astro Esqueleto HTML común: fuente, favicon, robots, salto al contenido y <main>
  lib/site-env.ts          SITE_ENV e isIndexable
  pages/                   Páginas en español; pages/en/, las inglesas
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

<p>{t("placeholder.text")}</p>
```

## Añadir una página en los 2 idiomas

1. Crea la versión española en `src/pages/<slug>/index.astro` y la inglesa en `src/pages/en/<slug-en>/index.astro` (el slug inglés va traducido). Las dos usan `BaseLayout` con su `lang`.
2. Si la página necesita textos de interfaz nuevos, añade la clave a `es` y a `en` en `src/i18n/ui.ts`.
3. Comprueba con `npm run check && npm run build` que salen `dist/<slug>/index.html` y `dist/en/<slug-en>/index.html`.

A partir de M1.3 las páginas pasan a la colección de contenido `pages` (un Markdown por idioma con `locale` y `translationKey`) y una ruta dinámica las genera; este apartado se actualizará entonces.
