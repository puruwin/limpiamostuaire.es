# limpiamostuaire.es

Web de «Limpiamos tu aire»: limpieza en profundidad de aires acondicionados. Operador en Benidorm: Ti&Di.

Sitio estático en español e inglés hecho con [Astro](https://astro.build), TypeScript strict y Tailwind CSS. El plan está en las issues y milestones del repositorio; la identidad visual, en [`DESIGN.md`](DESIGN.md).

## Requisitos

- Node 24 (versión fijada en `.node-version`; Astro exige ≥ 22.23.4).
- npm.

## Comandos

| Comando                | Qué hace                                                           |
| ---------------------- | ------------------------------------------------------------------ |
| `npm ci`               | Instala las dependencias exactas de `package-lock.json`            |
| `npm run dev`          | Servidor de desarrollo en `http://localhost:4321/`                 |
| `npm run build`        | Genera el sitio estático en `dist/`                                |
| `npm run preview`      | Sirve `dist/` en local para revisarlo                              |
| `npm run check`        | Tipos de Astro y TypeScript (`astro check`), claves de `ui.ts`     |
| `npm test`             | Tests con `node --test` (`src/**/*.test.ts`)                       |
| `npm run check:robots` | Meta robots de `dist/` y `robots.txt` según `SITE_ENV`             |
| `npm run check:csp`    | CSP de cada página de `dist/`: hashes, sin `unsafe-inline`         |
| `npm run check:caddy`  | `deploy/Caddyfile` con Caddy real: cabeceras, caché, 301 y 404     |
| `npm run check:seo`    | SEO de `dist/`: H1, title, canonical, hreflang, JSON-LD y sitemap  |
| `npm run check:claims` | Sin desinfección ni claims biocidas (ROESB) ni fotos hechas con IA |
| `npm run lint`         | ESLint (TypeScript, Astro y accesibilidad)                         |
| `npm run format`       | Formatea con Prettier (incluye el orden de clases de Tailwind)     |
| `npm run format:check` | Comprueba el formato sin tocar ficheros                            |

Los `check:*` van después de `npm run build`. `check:caddy` necesita el binario de Caddy (`caddy` en el `PATH` o `CADDY=/ruta/caddy`).

El CI (`.github/workflows/ci.yml`) ejecuta todo lo anterior en cada PR y en cada push a `main`, y despliega: cada PR en `staging.limpiamostuaire.es` (con contraseña) y `main` en `limpiamostuaire.es`. Antes de abrir un PR, pásalos en local.

Solo `SITE_ENV=production` genera páginas indexables; sin variable, el build lleva `noindex`. Hasta el lanzamiento (M5.2), `main` se construye con `provisional`. Detalles, cabeceras de seguridad y puesta en marcha del VPS: [`docs/despliegue.md`](docs/despliegue.md).

## Estructura

```text
astro.config.mjs           site, trailingSlash 'always', build.format 'directory', i18n, fuente Figtree, SITE_ENV y CSP
src/
  content.config.ts        Esquema de la colección pages
  content/pages/es/, en/   Un Markdown (.md, o .mdx con bloques) por página e idioma
  i18n/locales.ts          Idiomas: es en la raíz, en en /en/
  i18n/ui.ts               Cadenas de interfaz de los 2 idiomas
  layouts/BaseLayout.astro Esqueleto HTML común: fuente, favicon, robots, salto al contenido, cabecera, <main>, pie y WhatsApp flotante
  components/bloques/      Bloques de las páginas .mdx: secciones, precios «desde», zonas, trabajos, preguntas y contacto
  components/              Cabecera, pie, selector de idioma, WhatsApp flotante, iconos, NotFound.astro (la 404) y Seo.astro (title, canonical, hreflang, Open Graph y JSON-LD)
  data/business.ts         Datos del negocio (NAP, horario, zonas): única fuente, igual que la ficha de Google
  data/tarifa.ts           Tarifa de casa y negocio, suplementos y precio de lanzamiento: única fuente para el schema y las páginas
  data/trabajos.ts         Fotos de antes y después de trabajos reales (M0.4)
  data/pasos.ts            Pasos de la limpieza de un split y la foto propia de cada uno (M0.4)
  data/operador.ts         Operador local (Ti&Di): equipo, logo, avatar y su página (/benidorm/)
  data/resenas.ts          Reseñas reales de la ficha de Google, con permiso
  integrations/            Guarda de {{PENDIENTE sobre dist/ en producción y en/404.html en su sitio
  lib/pages.ts             URL de cada página, equivalentes por idioma y validación de la colección
  lib/format.ts            Euros, listas y fechas en el idioma de la página
  lib/collection.ts        Acceso a la colección para los componentes y claves del menú y del pie
  lib/pendientes.ts        Búsqueda de {{PENDIENTE en un directorio
  lib/seo-check.ts         Reglas de check:seo sobre el HTML de dist/
  lib/claims-check.ts      Reglas de check:claims: claims biocidas en dist/ e imágenes con C2PA de IA
  lib/sitemap.ts           URLs y XML de sitemap.xml (lastmod desde updated)
  lib/site.ts              Origen de producción (site de Astro, canonical y check:seo)
  lib/site-env.ts          SITE_ENV e isIndexable
  lib/structured-data.ts   Grafo JSON-LD: WebSite, WebPage, Organization, LocalBusiness Ti&Di, Service y migas
  pages/[...path].astro    Ruta dinámica que genera todas las páginas de la colección
  pages/404.astro, en/     Páginas 404 de cada idioma
  pages/sitemap.xml.ts     sitemap.xml
  pages/robots.txt.ts      robots.txt
  templates/               Plantillas de página (campo template)
  styles/global.css        Entrada de Tailwind con los colores de DESIGN.md
public/                    Ficheros que se copian tal cual a dist/ (favicon, og.png, logo.png y la clave de IndexNow)
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

Cada página es un Markdown (`.md`) o un MDX (`.mdx`, si usa bloques) en `src/content/pages/<locale>/` y `src/pages/[...path].astro` las genera todas; no se crean `.astro` en `src/pages/`.

```md
---
locale: es # es | en; tiene que coincidir con la carpeta
translationKey: precios # igual en la versión de cada idioma
slug: precios # sin barras; "" para la home. La URL sale de aquí: /precios/, /en/prices/
title: Precio de limpieza de aire acondicionado · Tarifa por split # ≤ 60 caracteres, tal cual, sin sufijo de marca
description: … # ≤ 155 caracteres
h1: Precios
template: pagina # plantilla de src/templates/: basica, home, pagina (H1, entradilla y bloques) u operador (pagina + tarjeta del operador)
lead: … # opcional; entradilla bajo el H1 (plantillas home y pagina)
draft: false # opcional; true = borrador
updated: 2026-11-25
---

Cuerpo en Markdown.
```

1. Crea `src/content/pages/es/<nombre>.md` y `src/content/pages/en/<nombre>.md` con el mismo `translationKey` y el `slug` traducido. El nombre del fichero no afecta a la URL.
2. Para una plantilla nueva, crea `src/templates/<Nombre>.astro` (recibe `page` y el cuerpo por `<slot />`), añádela al `z.enum` de `template` en `src/content.config.ts` y al mapa `templates` de `src/pages/[...path].astro`.
3. Las páginas del menú y del pie aparecen solas en cuanto existen, si usan estas `translationKey`: `precios`, `como-lo-hacemos`, `negocios`, `benidorm` y `sobre-nosotros` (menú y pie); `conductos` y `apartamentos-turisticos` (solo pie); `aviso-legal`, `privacidad` y `cookies` (barra legal). Están en `navKeys` (`src/lib/collection.ts`).
4. Si la página necesita textos de interfaz nuevos, añade la clave a `es` y a `en` en `src/i18n/ui.ts`.
5. `npm run check && npm run build`.

### Bloques (páginas `.mdx`)

Un `.mdx` usa los bloques de `src/components/bloques/` sin importarlos: la ruta dinámica se los pasa (`bloques` en `index.ts`). Cogen el idioma de la URL y los datos de `src/data/`, así que ningún precio ni municipio se escribe a mano en el texto. Deja una línea en blanco entre la etiqueta y el texto para que dentro se lea como Markdown.

| Bloque                                                                                    | Qué pinta                                                                                    |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `<Seccion id titulo tono>`                                                                | Sección con su `h2`. `tono`: `fondo` (por defecto), `suave` o `tinta`                        |
| `<Rejilla>` + `<Tarjeta titulo>`                                                          | Tarjetas en 2 columnas desde `md`                                                            |
| `<PreciosDesde />`, `<PreciosDesde segmento="negocio" />`                                 | «Desde» de casa y de negocio (o solo el del segmento), más el lanzamiento si es de casa      |
| `<TablaPrecios />`                                                                        | Tarifa entera de casa y negocio: 1–3 splits, el adicional y los suplementos                  |
| `<Lanzamiento detalle />`                                                                 | Precio de lanzamiento; con `detalle`, también el precio de los demás splits                  |
| `<Ejemplo segmento="vivienda" splits={3} exteriores={1} />`                               | Presupuesto con líneas y total (`fueraDeZona` opcional); en casa, también con el lanzamiento |
| `<Suplemento tipo="exterior" />`, `<Suplemento tipo="fueraDeZona" segmento="vivienda" />` | Importe del suplemento, dentro de una frase                                                  |
| `<Municipios />`, `<Municipios chips />`                                                  | Los municipios de `business.ts`, en la frase («A, B y C») o como lista                       |
| `<Trabajos />`                                                                            | Antes y después de `src/data/trabajos.ts`; sin trabajos, un `{{PENDIENTE`                    |
| `<Resenas />`                                                                             | Reseñas de `src/data/resenas.ts` y enlace a la ficha; sin reseñas, nada                      |
| `<Pasos>` + `<Paso titulo foto="turbina">`                                                | Pasos numerados con la foto de cada uno (`src/data/pasos.ts`); sin foto, un `{{PENDIENTE`    |
| `<Pregunta titulo>`                                                                       | Pregunta frecuente plegable (sin JS ni `FAQPage`)                                            |
| `<EnlacePagina clave="precios">texto</EnlacePagina>`                                      | Enlace a otra página del idioma; no sale nada mientras no exista                             |
| `<Contacto titulo>`                                                                       | Bloque final sobre tinta con WhatsApp, teléfono y horario                                    |

El precio de lanzamiento (`lanzamiento` en `src/data/tarifa.ts`) sale solo si el día del build, en hora de Madrid, es su fecha de fin o anterior. Pasada esa fecha, hace falta un despliegue para que desaparezca. Con el lanzamiento, el primer split sale a su precio y cada uno de los demás al del split adicional (`presupuesto()` en `tarifa.ts`). Las `description` de la home, precios, negocios y Benidorm llevan precios escritos a mano: si cambia la tarifa, cámbialas también.

El build falla en cualquier entorno si dos páginas del mismo idioma comparten ruta o `translationKey`, o si el `locale` no coincide con la carpeta. Un campo que falte o no cumpla el esquema también (un `title` de más de 60 caracteres o una `description` de más de 155, por ejemplo).

## SEO de cada página

`src/components/Seo.astro` (desde `BaseLayout`) pone en el `<head>` el `title` y la `description` del frontmatter, la canonical absoluta a `https://limpiamostuaire.es`, Open Graph con la imagen por defecto `public/og.png` y un `hreflang` por cada idioma en el que exista la página (mismo `translationKey`), más `x-default` a la versión en español. Una página que solo existe en un idioma lleva hreflang solo a sí misma: el selector de idioma lleva a la home del otro, pero eso no es una equivalente. La canonical apunta siempre a producción, también en staging.

`npm run check:seo` lo comprueba en `dist/` (reglas en `src/lib/seo-check.ts`): un solo `<h1>`; `title` ≤ 60 y `description` ≤ 155 caracteres; `<html lang>` según la ruta; canonical y `og:url` a la propia URL; hreflang a sí misma, recíproco y con `x-default` a la española; `og:image` existente; y enlaces internos solo a páginas del mismo idioma. El único enlace que puede cruzar de idioma es el que lleva `hreflang` (el selector). Las 404 (`404.html` y `en/404.html`) van sin canonical ni hreflang.

### Datos estructurados

`Seo.astro` añade también un `<script type="application/ld+json">` con un solo `@graph` (`src/lib/structured-data.ts`):

- `WebSite` y `WebPage` con `inLanguage`. En _Sobre nosotros_ (`aboutKeys`), `AboutPage`, con `about` hacia la marca y Ti&Di.
- `Organization` «Limpiamos tu aire», con `logo` (`public/logo.png`).
- `LocalBusiness` «Ti&Di», con `parentOrganization` hacia la marca, teléfono, correo, solo la localidad (la dirección está oculta), zonas, horario, `sameAs` a la ficha de Google y `url` a la página del operador (`/benidorm/`, la que enlaza la ficha) o, si no existe en el idioma, a la home.
- En la home, precios y Benidorm (`serviceKeys`), un `Service` con la tarifa de `src/data/tarifa.ts`.
- Fuera de la home, `BreadcrumbList` con las páginas que existen en el camino del slug.

No lleva `FAQPage`, porque Google retiró ese resultado. Todo sale de `src/data/`: un dato nuevo del negocio se cambia allí, no en el JSON.

`check:seo` exige en cada página:

- Un solo bloque válido.
- `WebSite.inLanguage` igual al idioma de la ruta.
- `Organization` y `LocalBusiness` enlazados.
- Ninguna `FAQPage`.
- URLs absolutas del sitio cuyos ficheros existan en `dist/`.
- Migas que acaben en la canonical.

La 404 no lleva JSON-LD. Para validar a mano, pega el HTML de `dist/index.html` en el modo «Código» del [Rich Results Test](https://search.google.com/test/rich-results) y en [validator.schema.org](https://validator.schema.org/).

### Sitemap, robots y 404

- `/sitemap.xml` lista todas las páginas de la colección salvo los borradores. El `lastmod` de cada una es su campo `updated`, no la fecha del build: cambia `updated` solo cuando cambie el contenido de verdad. `check:seo` exige que cada URL del sitemap sea una página de `dist/` con `lastmod` válido y, en producción, que estén todas.
- `/robots.txt` es igual en todos los entornos: permite todo y enlaza el sitemap. Nunca lleva `Disallow` fuera de producción, porque lo que impide indexar es el `noindex` ([`docs/despliegue.md`](docs/despliegue.md#indexación)). `check:robots` lo comprueba.
- La 404 de cada idioma (`src/components/NotFound.astro`) sale en `dist/404.html` y `dist/en/404.html`. Caddy la sirve con estado 404 en cualquier ruta que no exista: la inglesa bajo `/en/`, la española en el resto.
- IndexNow (Bing, Copilot): clave y comando de envío en [`docs/seo/indexnow.md`](docs/seo/indexnow.md). Solo tras el lanzamiento.

## Publicidad e imágenes permitidas

No estamos inscritos en el ROESB, así que no podemos anunciar desinfección ni ningún efecto biocida. Las fotos de trabajos tienen que ser reales. `npm run check:claims` (reglas en `src/lib/claims-check.ts`) lo comprueba en cualquier entorno:

- **Texto de `dist/`**, en español e inglés, también `alt`, `meta` y JSON-LD; sin tildes ni mayúsculas que valgan. Falla con: desinfección (y desinfectar, desinfectante…), antibacteriano, antimicrobiano, antiviral, antifúngico, bactericida, fungicida, virucida, germicida, legionela, 99,9 %, esterilizar, higienizar, «elimina / mata / acaba con» bacterias, virus, gérmenes, hongos, moho o ácaros, «libre de bacterias» y sus equivalentes en inglés (disinfect, antibacterial, sanitize, kills germs, germ-free…). Describir el problema sí se puede («la suciedad favorece el moho y las bacterias»); prometer que lo eliminamos, no. Lo que hacemos es limpiar: desmontar, lavar a presión y retirar la suciedad.
- **Imágenes y vídeos de `src/` y `public/`**: ninguno con C2PA o XMP `trainedAlgorithmicMedia` o `compositeWithTrainedAlgorithmicMedia` (generado o retocado con IA). Los logos e ilustraciones de marca van en una carpeta `marca/` (o son `favicon`, `logo.png` y `og.png` de `public/`) y no se miran. Se comprueban las fuentes porque Astro quita los metadatos al optimizar. Una imagen sin metadatos pasa: la regla para descuidos, no sustituye a usar fotos propias (M0.4).

El error da el fichero, la regla, la palabra y el contexto.

## Guardas de producción

Con `SITE_ENV=production` (y solo entonces), `npm run build` falla si:

- alguna página tiene `draft: true` (lo comprueba la ruta dinámica);
- queda un `{{PENDIENTE` en cualquier fichero de `dist/`, HTML o no (integración `src/integrations/production-guards.ts`, al final del build). El error da fichero y línea.

Para marcar un texto que falta, escribe `{{PENDIENTE: lo que falta}}`. En staging, `provisional` y local los borradores se generan y los huecos se publican, para revisarlos; el día del lanzamiento (M5.2) bloquean el despliegue. Para probarlo en local: `SITE_ENV=production npm run build`.
