// Comprueba la indexación de dist/ según SITE_ENV (docs/despliegue.md#indexación):
// - Meta robots: con "production" ninguna página lleva noindex, salvo las de
//   resultado del formulario (quoteResultFiles), que lo llevan siempre; con
//   cualquier otro valor (o ninguno), todas, las 404 incluidas.
// - robots.txt: existe y enlaza ${SITE}/sitemap.xml. Fuera de producción, sin
//   ningún Disallow (si Google no rastrea, no ve el noindex); en producción,
//   nunca Disallow: / (bloquearía la web entera).
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { quoteResultFiles } from "../src/data/quote-form.ts";
import { SITE } from "../src/lib/site.ts";

const siteEnv = process.env.SITE_ENV || "development";
const indexable = siteEnv === "production";
const noindex = /<meta\s+name="robots"\s+content="[^"]*noindex/i;

const files = (await readdir("dist", { recursive: true }))
  .map((file) => file.replace(/\\/g, "/"))
  .filter((file) => file.endsWith(".html"));

if (files.length === 0) {
  console.error("No hay HTML en dist/. Ejecuta antes npm run build.");
  process.exit(1);
}

const errors = [];
for (const file of files) {
  const hasNoindex = noindex.test(await readFile(join("dist", file), "utf8"));
  const wanted = !indexable || quoteResultFiles.includes(file);
  if (hasNoindex !== wanted) {
    errors.push(`dist/${file}: debería ir ${wanted ? "con" : "sin"} noindex.`);
  }
}

const robots = await readFile(join("dist", "robots.txt"), "utf8").catch(
  () => undefined,
);
if (robots === undefined) {
  errors.push("dist/robots.txt no existe.");
} else {
  const lines = robots.split(/\r?\n/).map((line) => line.trim());
  const sitemap = `Sitemap: ${SITE}/sitemap.xml`;
  if (!lines.includes(sitemap)) {
    errors.push(`dist/robots.txt: falta «${sitemap}».`);
  }
  for (const line of lines) {
    const disallow = /^disallow:\s*(.*)$/i.exec(line)?.[1]?.trim();
    if (!disallow) continue;
    if (!indexable) {
      errors.push(
        `dist/robots.txt: «${line}» fuera de producción; lo que impide indexar es el noindex.`,
      );
    } else if (disallow === "/") {
      errors.push(`dist/robots.txt: «${line}» bloquea la web entera.`);
    }
  }
}

if (errors.length > 0) {
  console.error(`SITE_ENV=${siteEnv}: ${errors.length} problemas:`);
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
}

console.log(
  `SITE_ENV=${siteEnv}: ${files.length} páginas ${indexable ? "indexables" : "con noindex"} y robots.txt sin bloqueos.`,
);
