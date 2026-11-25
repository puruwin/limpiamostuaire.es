// Comprueba los enlaces internos de dist/ (después de npm run build):
// - Cada href/src interno lleva a un fichero que existe. Las páginas van con
//   barra final (trailingSlash: "always"): "/precios" falla aunque exista
//   "/precios/", porque obliga a una redirección.
// - Los anclas (#faq) existen en la página de destino.
// - Los hreflang son recíprocos: si A apunta a B como alternativa, B apunta a A.
// Los enlaces externos no se comprueban: no hay red en el gate.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const SITE = "https://limpiamostuaire.es";

const all = (await readdir("dist", { recursive: true, withFileTypes: true }))
  .filter((f) => f.isFile())
  .map((f) =>
    join(f.parentPath, f.name).replace(/\\/g, "/").slice("dist/".length),
  );
const files = new Set(all);
const htmlFiles = all.filter((f) => f.endsWith(".html"));

if (htmlFiles.length === 0) {
  console.error("No hay HTML en dist/. Ejecuta antes npm run build.");
  process.exit(1);
}

// "index.html" → "/", "precios/index.html" → "/precios/", "404.html" → "/404.html"
const urlOf = (file) =>
  "/" +
  (file.endsWith("index.html") ? file.slice(0, -"index.html".length) : file);

// "/precios/" → "precios/index.html"; "/favicon.svg" → "favicon.svg"
const fileOf = (path) =>
  path.endsWith("/") ? `${path.slice(1)}index.html` : path.slice(1);

const decode = (s) =>
  s.replaceAll("&amp;", "&").replaceAll("&#39;", "'").replaceAll("&quot;", '"');

const pages = new Map();
for (const file of htmlFiles) {
  const html = await readFile(join("dist", file), "utf8");
  const ids = new Set(
    [...html.matchAll(/\s(?:id|name)="([^"]+)"/gi)].map((m) => decode(m[1])),
  );
  const links = [];
  for (const [tag] of html.matchAll(
    /<(?:a|link|img|script|source|iframe)\b[^>]*>/gi,
  )) {
    for (const [, attr, value] of tag.matchAll(
      /\s(href|src|srcset)="([^"]*)"/gi,
    )) {
      const values =
        attr.toLowerCase() === "srcset"
          ? value.split(",").map((s) => s.trim().split(/\s+/)[0])
          : [value];
      for (const v of values) if (v) links.push(decode(v));
    }
  }
  const alternates = [...html.matchAll(/<link\b[^>]*\brel="alternate"[^>]*>/gi)]
    .map(([tag]) => ({
      lang: /\shreflang="([^"]+)"/i.exec(tag)?.[1],
      href: /\shref="([^"]+)"/i.exec(tag)?.[1],
    }))
    .filter((a) => a.lang && a.href && a.lang !== "x-default");
  pages.set(urlOf(file), { file, ids, links, alternates });
}

// Ruta interna de un enlace, o null si es externo o no es una URL navegable.
function internal(link, from) {
  if (/^(mailto|tel|sms|javascript|data|blob):/i.test(link)) return null;
  if (
    /^(https?:)?\/\//i.test(link) &&
    !link.startsWith(SITE + "/") &&
    link !== SITE
  )
    return null;
  const url = new URL(link, SITE + from);
  if (url.origin !== SITE) return null;
  return {
    path: decodeURI(url.pathname),
    hash: decodeURIComponent(url.hash.slice(1)),
  };
}

const errors = [];
let checked = 0;
for (const [from, page] of pages) {
  for (const link of page.links) {
    const target = internal(link, from);
    if (!target) continue;
    checked++;
    const where = `dist/${page.file}: «${link}»`;
    if (!files.has(fileOf(target.path))) {
      if (files.has(fileOf(target.path + "/")))
        errors.push(`${where} sin barra final (debería ser ${target.path}/).`);
      else errors.push(`${where} no existe.`);
      continue;
    }
    if (target.hash && target.hash !== "top") {
      const dest = pages.get(target.path);
      if (dest && !dest.ids.has(target.hash))
        errors.push(
          `${where}: no hay ningún id="${target.hash}" en ${target.path}.`,
        );
    }
  }
  for (const alt of page.alternates) {
    const target = internal(alt.href, from);
    if (!target) continue;
    const dest = pages.get(target.path);
    if (!dest) continue; // ya avisado arriba como enlace roto
    const back = dest.alternates.some(
      (a) => internal(a.href, target.path)?.path === from,
    );
    if (!back)
      errors.push(
        `dist/${page.file}: hreflang="${alt.lang}" → ${target.path}, pero esa página no enlaza de vuelta a ${from}.`,
      );
  }
}

if (errors.length > 0) {
  console.error(`Enlaces: ${errors.length} problemas:`);
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
}
console.log(`Enlaces OK: ${pages.size} páginas, ${checked} enlaces internos.`);
