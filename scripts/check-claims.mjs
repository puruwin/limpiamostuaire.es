// Comprueba lo que no podemos publicar (reglas en src/lib/claims-check.ts):
// - Texto de dist/ (ES y EN, también atributos y JSON-LD): sin desinfección
//   ni efectos biocidas, que exigen estar inscritos en el ROESB.
// - Imágenes y vídeos de src/ y public/: ninguno con C2PA o XMP
//   trainedAlgorithmicMedia (generado con IA), salvo los de marca (carpetas
//   marca/ y favicon, logo y og de public/). Se miran las fuentes porque
//   Astro quita los metadatos al optimizar las de src/.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  checkClaims,
  checkMedia,
  isCheckedMedia,
  TEXT_EXTENSIONS,
} from "../src/lib/claims-check.ts";

const list = async (dir) =>
  (await readdir(dir, { recursive: true }))
    .map((file) => file.replace(/\\/g, "/"))
    .map((file) => `${dir}/${file}`);

const texts = await Promise.all(
  (await list("dist"))
    .filter((file) => TEXT_EXTENSIONS.test(file))
    .map(async (file) => ({
      file: file.slice("dist/".length),
      text: await readFile(file, "utf8"),
    })),
);

if (!texts.some((file) => file.file.endsWith(".html"))) {
  console.error("No hay HTML en dist/. Ejecuta antes npm run build.");
  process.exit(1);
}

const media = await Promise.all(
  [...(await list("src")), ...(await list("public"))]
    .filter(isCheckedMedia)
    .map(async (file) => ({ file, bytes: await readFile(join(file)) })),
);

const errors = [
  ...checkClaims(texts).map((error) => `dist/${error}`),
  ...checkMedia(media),
];

if (errors.length > 0) {
  console.error(`Claims: ${errors.length} problemas:`);
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
}

console.log(
  `Claims: ${texts.length} ficheros de texto de dist/ y ${media.length} imágenes o vídeos correctos.`,
);
