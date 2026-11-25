// Comprueba que el meta robots de dist/ corresponde a SITE_ENV: con
// "production" ninguna página lleva noindex; con cualquier otro valor (o
// ninguno), todas. robots.txt y las 404 llegan en M1.7.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

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
  if (hasNoindex === indexable) {
    errors.push(
      `dist/${file}: debería ir ${indexable ? "sin" : "con"} noindex.`,
    );
  }
}

if (errors.length > 0) {
  console.error(`SITE_ENV=${siteEnv}: ${errors.length} problemas:`);
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
}

console.log(
  `SITE_ENV=${siteEnv}: ${files.length} páginas ${indexable ? "indexables" : "con noindex"}.`,
);
