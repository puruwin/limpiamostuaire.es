import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { locales } from "./i18n/locales.ts";

// Una página = un Markdown por idioma en src/content/pages/<locale>/.
// La ruta dinámica src/pages/[...path].astro las genera todas.
const pages = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/pages",
    // id = ruta del fichero ("es/inicio"). Por defecto glob usaría el campo
    // `slug`, que se repite entre idiomas ("" en las dos homes).
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
  schema: z.object({
    locale: z.enum(locales),
    /** Igual en las versiones de una misma página en cada idioma (hreflang). */
    translationKey: z.string().min(1),
    /** Ruta sin prefijo de idioma ni barras: "" para la home, "precios", "zonas/benidorm". */
    slug: z.string().regex(/^([a-z0-9-]+(\/[a-z0-9-]+)*)?$/, {
      message:
        'minúsculas, cifras y guiones separados por "/", sin barras al principio ni al final',
    }),
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    h1: z.string().trim().min(1),
    template: z.enum(["basica"]),
    /** Un borrador se genera en staging y provisional; en producción rompe el build. */
    draft: z.boolean().default(false),
    updated: z.coerce.date(),
  }),
});

export const collections = { pages };
