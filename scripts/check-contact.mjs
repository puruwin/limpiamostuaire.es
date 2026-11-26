// Comprueba el teléfono y WhatsApp de cada página de dist/ (reglas en
// src/lib/contact-check.ts):
// - tel: y wa.me con el número de src/data/business.ts.
// - El texto de WhatsApp, el de la página en su idioma (casa, negocio o
//   conductos) en la cabecera, el botón flotante y las CTA.
// - Teléfono y WhatsApp en la cabecera, el botón flotante y, en las
//   plantillas home, pagina y operador, al menos una CTA.
// La página de cada URL sale del frontmatter de src/content/pages/.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  checkContact,
  CTA_TEMPLATES,
  frontmatterPage,
} from "../src/lib/contact-check.ts";
import { locales } from "../src/i18n/locales.ts";
import { pagePath } from "../src/lib/pages.ts";

const list = async (dir) =>
  (await readdir(dir, { recursive: true })).map((file) =>
    file.replace(/\\/g, "/"),
  );

const pages = await Promise.all(
  (await list("dist"))
    .filter((file) => file.endsWith(".html"))
    .map(async (file) => ({
      file,
      html: await readFile(join("dist", file), "utf8"),
    })),
);

if (pages.length === 0) {
  console.error("No hay HTML en dist/. Ejecuta antes npm run build.");
  process.exit(1);
}

const errors = [];
const collection = new Map();
const contentDir = "src/content/pages";
for (const file of (await list(contentDir)).filter((f) => /\.mdx?$/.test(f))) {
  const data = frontmatterPage(await readFile(join(contentDir, file), "utf8"));
  if (!data || !locales.includes(data.locale)) {
    errors.push(
      `${contentDir}/${file}: frontmatter sin locale, slug, translationKey o template.`,
    );
    continue;
  }
  collection.set(pagePath(data.locale, data.slug), {
    translationKey: data.translationKey,
    cta: CTA_TEMPLATES.has(data.template),
  });
}

errors.push(...checkContact(pages, collection).map((error) => `dist/${error}`));

if (errors.length > 0) {
  console.error(`Contacto: ${errors.length} problemas:`);
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
}

console.log(
  `Contacto: teléfono y WhatsApp correctos en ${pages.length} páginas.`,
);
