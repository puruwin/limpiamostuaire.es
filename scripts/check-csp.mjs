// Comprueba la CSP que Astro pone en cada página (security.csp en
// astro.config.mjs):
// - Hay un solo <meta http-equiv="content-security-policy">.
// - script-src no lleva 'unsafe-inline' ni 'unsafe-eval' (con ellos,
//   securityheaders.com no da A+ y la CSP deja de proteger contra XSS).
// - Cada <script> y <style> inline tiene su hash en la política: si no, el
//   navegador lo bloquea sin que el build avise.
// - Nada de atributos style="" ni on*="": la CSP los bloquea.
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const files = (await readdir("dist", { recursive: true }))
  .map((file) => file.replace(/\\/g, "/"))
  .filter((file) => file.endsWith(".html"));

if (files.length === 0) {
  console.error("No hay HTML en dist/. Ejecuta antes npm run build.");
  process.exit(1);
}

const sha256 = (text) =>
  `'sha256-${createHash("sha256").update(text).digest("base64")}'`;

const errors = [];
let inline = 0;
for (const file of files) {
  const html = await readFile(join("dist", file), "utf8");
  const metas = [
    ...html.matchAll(
      /<meta\s+http-equiv="content-security-policy"\s+content="([^"]*)"/gi,
    ),
  ];
  if (metas.length !== 1) {
    errors.push(
      `dist/${file}: ${metas.length} <meta> de CSP, debería haber 1.`,
    );
    continue;
  }
  const directives = new Map(
    metas[0][1]
      .replaceAll("&#39;", "'")
      .split(";")
      .map((d) => d.trim().split(/\s+/))
      .filter((d) => d[0])
      .map(([name, ...sources]) => [name, new Set(sources)]),
  );
  const scriptSrc = directives.get("script-src") ?? new Set();
  const styleSrc = directives.get("style-src") ?? new Set();
  for (const bad of ["'unsafe-inline'", "'unsafe-eval'"]) {
    if (scriptSrc.has(bad)) errors.push(`dist/${file}: script-src con ${bad}.`);
  }

  for (const [, attrs, body] of html.matchAll(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
  )) {
    if (/\ssrc=/i.test(attrs) || /type="application\/ld\+json"/i.test(attrs)) {
      continue;
    }
    inline++;
    if (!scriptSrc.has(sha256(body))) {
      errors.push(`dist/${file}: <script> inline sin hash en script-src.`);
    }
  }
  for (const [, body] of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    inline++;
    if (!styleSrc.has(sha256(body))) {
      errors.push(`dist/${file}: <style> inline sin hash en style-src.`);
    }
  }
  if (/<[a-z][^>]*\sstyle="/i.test(html)) {
    errors.push(`dist/${file}: atributo style="" (la CSP lo bloquea).`);
  }
  if (/<[a-z][^>]*\son[a-z]+="/i.test(html)) {
    errors.push(`dist/${file}: atributo on…="" (la CSP lo bloquea).`);
  }
}

if (errors.length > 0) {
  console.error(`CSP: ${errors.length} problemas:`);
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
}
console.log(
  `CSP OK: ${files.length} páginas, ${inline} bloques inline con su hash.`,
);
