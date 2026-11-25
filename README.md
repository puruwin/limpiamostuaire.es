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
| `npm run lint`         | ESLint (TypeScript, Astro y accesibilidad)                     |
| `npm run format`       | Formatea con Prettier (incluye el orden de clases de Tailwind) |
| `npm run format:check` | Comprueba el formato sin tocar ficheros                        |

El CI (`.github/workflows/ci.yml`) ejecuta `format:check`, `lint`, `check`, `test` y `build` en cada PR y en cada push a `main`. Antes de abrir un PR, pásalos en local.

Hasta M1.2 todas las páginas llevan `noindex, nofollow`.

## Estructura

```text
astro.config.mjs           site, trailingSlash 'always', build.format 'directory', i18n y fuente Figtree
src/
  i18n/locales.ts          Idiomas: es en la raíz, en en /en/
  i18n/ui.ts               Cadenas de interfaz de los 2 idiomas
  layouts/BaseLayout.astro Esqueleto HTML común: fuente, favicon, salto al contenido y <main>
  pages/                   Páginas en español; pages/en/, las inglesas
  styles/global.css        Entrada de Tailwind con los colores de DESIGN.md
public/                    Ficheros que se copian tal cual a dist/ (favicon)
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
