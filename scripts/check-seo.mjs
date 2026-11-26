// Comprueba el SEO de cada página de dist/ (reglas en src/lib/seo-check.ts):
// - Un solo <h1>; <title> ≤ 60 caracteres y description ≤ 155.
// - <html lang> según la ruta (/en/ → en; el resto, es).
// - Canonical absoluta a sí misma, igual que og:url.
// - hreflang a sí misma, recíproco con cada versión y x-default a la española.
// - og:image absoluta y presente en dist/.
// - Enlaces internos solo a páginas de su idioma, salvo el selector (hreflang).
// - Un JSON-LD válido: WebSite con inLanguage, Organization y LocalBusiness
//   con parentOrganization, sin FAQPage, URLs absolutas existentes y migas
//   que acaban en la página.
// La 404 no lleva canonical, hreflang ni JSON-LD.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { checkSeo } from "../src/lib/seo-check.ts";
import { SITE } from "../src/lib/site.ts";

const files = (await readdir("dist", { recursive: true })).map((file) =>
  file.replace(/\\/g, "/"),
);
const pages = await Promise.all(
  files
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

const errors = checkSeo(pages, { site: SITE, files: new Set(files) });

if (errors.length > 0) {
  console.error(`SEO: ${errors.length} problemas:`);
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
}

console.log(`SEO: ${pages.length} páginas correctas.`);
