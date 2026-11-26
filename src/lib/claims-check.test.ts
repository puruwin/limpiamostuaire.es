import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  CLAIM_RULES,
  checkClaims,
  checkMedia,
  isAiGenerated,
  isCheckedMedia,
} from "./claims-check.ts";

const page = (body: string, head = "") =>
  `<!doctype html><html lang="es"><head>${head}</head><body><main>${body}</main></body></html>`;

const errorsOf = (body: string, head = "") =>
  checkClaims([{ file: "index.html", text: page(body, head) }]);

/** Una o más frases que tiene que parar cada regla (prueba negativa). */
const BANNED: Record<string, string[]> = {
  desinfección: [
    "Limpieza y desinfección del split.",
    "Desinfectamos el equipo.",
    "Con producto desinfectante.",
    "Lo dejamos desinfectado.",
  ],
  disinfection: ["We disinfect your AC.", "Deep cleaning and disinfection."],
  antibacteriano: [
    "Tratamiento antibacteriano.",
    "Antibacterial treatment.",
    "Anti-bacterial spray.",
  ],
  antimicrobiano: ["Producto antimicrobiano.", "Antimicrobial coating."],
  antiviral: ["Filtro antiviral.", "Tratamiento antivírico."],
  antifúngico: ["Tratamiento antifúngico.", "Antifungal spray."],
  "biocida (-cida)": [
    "Aplicamos bactericida.",
    "Con fungicida.",
    "Producto virucida.",
    "Acción viricida.",
    "Germicidal UV lamp.",
  ],
  legionela: [
    "Prevención de la legionela.",
    "Legionella prevention.",
    "Riesgo de legionelosis.",
    "Legionnaires' disease.",
  ],
  "99,9 %": [
    "Elimina el 99,9 % de la suciedad.",
    "Hasta el 99,9&nbsp;%.",
    "Hasta el 99,9\u202f%.",
    "99.9% clean.",
    "El 99,99 % de los equipos.",
    "El 99,9 por ciento.",
  ],
  esterilización: ["Esterilizamos la bandeja.", "We sterilise the coil."],
  higienización: [
    "Higienizamos el equipo.",
    "Producto higienizante.",
    "We sanitize the unit.",
    "Sanitiser included.",
  ],
  "elimina bacterias, virus, hongos…": [
    "Elimina bacterias.",
    "Eliminamos el moho y las bacterias.",
    "Eliminamos todas las bacterias.",
    "Acaba con los virus.",
    "Matamos los gérmenes.",
    "Destruye ácaros.",
    "Kills bacteria.",
    "Eliminates mould and germs.",
    "Gets rid of mold.",
    "Kills dust mites.",
  ],
  "libre de bacterias, virus, hongos…": [
    "Un aire libre de bacterias.",
    "Air free from germs.",
    "Germ-free air.",
  ],
};

test("hay una prueba negativa para cada regla", () => {
  assert.deepEqual(
    Object.keys(BANNED).sort(),
    CLAIM_RULES.map((rule) => rule.name).sort(),
  );
});

for (const [name, phrases] of Object.entries(BANNED)) {
  for (const phrase of phrases) {
    test(`${name}: para «${phrase}»`, () => {
      const errors = errorsOf(`<p>${phrase}</p>`);
      assert.ok(
        errors.some((e) => e.startsWith(`index.html: ${name} (`)),
        `sin error de «${name}»: ${JSON.stringify(errors)}`,
      );
    });
  }
}

test("texto permitido: limpieza, suciedad, moho y bacterias sin promesas", () => {
  assert.deepEqual(
    errorsOf(`
      <h1>Limpieza de aires acondicionados en profundidad</h1>
      <p>Desmontamos, lavamos a presión y retiramos la suciedad acumulada.</p>
      <p>La suciedad del filtro favorece el moho y las bacterias.</p>
      <p>Eliminamos la suciedad que alimenta el moho de la bandeja.</p>
      <p>El acabado de la carcasa queda como nuevo.</p>
      <p>We remove the dirt that builds up in the filter.</p>
      <p>Pulido 99 % mate. Skills: limpieza.</p>
      <img src="/a.webp" alt="Bandeja antes y después de la limpieza">`),
    [],
  );
});

test("mira atributos, meta y JSON-LD", () => {
  const ld =
    '<script type="application/ld+json">{"description":"Desinfección de aires"}</script>';
  const meta = '<meta name="description" content="Limpieza antibacteriana">';
  const errors = errorsOf(
    '<img src="/a.webp" alt="Tratamiento antifúngico">',
    meta + ld,
  );
  assert.equal(errors.length, 3, JSON.stringify(errors));
});

test("no mira CSS ni JS", () => {
  assert.deepEqual(
    errorsOf(
      "<p>Limpieza</p>",
      '<style>.a{width:99.9%}</style><script type="module">const desinfeccion = 1;</script>',
    ),
    [],
  );
});

test("sin tildes, en mayúsculas, con entidades y guiones blandos", () => {
  for (const phrase of [
    "DESINFECCION",
    "Desinfecci&#243;n",
    "Desin\u00adfección",
    "elimina&nbsp;bacterias",
  ]) {
    assert.notDeepEqual(errorsOf(`<p>${phrase}</p>`), [], phrase);
  }
});

test("no cruza el final de la frase ni de la etiqueta", () => {
  assert.deepEqual(
    errorsOf(
      "<p>Lo eliminamos todo.</p><p>Bacterias</p><p>Eliminamos la grasa. Bacterias, no.</p>",
    ),
    [],
  );
});

test("revisa otros ficheros de texto (sitemap, robots) tal cual", () => {
  assert.equal(
    checkClaims([
      { file: "sitemap.xml", text: "<loc>https://x.es/desinfeccion/</loc>" },
    ]).length,
    1,
  );
});

test("el error dice fichero, regla, palabra y contexto", () => {
  assert.deepEqual(
    errorsOf("<p>Limpiamos el split.</p><p>Desinfectamos el equipo.</p>"),
    [
      "index.html: desinfección («desinfectamos»): …limpiamos el split. desinfectamos el equipo.…",
    ],
  );
});

const png = (text = "") =>
  new Uint8Array([
    0x89,
    0x50,
    0x4e,
    0x47,
    ...new TextEncoder().encode(text),
    0,
  ]);

const IPTC = "http://cv.iptc.org/newscodes/digitalsourcetype/";

test("C2PA o XMP con trainedAlgorithmicMedia: generada con IA", () => {
  assert.equal(isAiGenerated(png(`${IPTC}trainedAlgorithmicMedia`)), true);
  assert.equal(
    isAiGenerated(png(`${IPTC}compositeWithTrainedAlgorithmicMedia`)),
    true,
  );
  assert.equal(isAiGenerated(png(`${IPTC}digitalCapture`)), false);
  assert.equal(isAiGenerated(png()), false);
});

test("detecta el C2PA real de ChatGPT (ilustración de marca de Ti&Di)", async () => {
  const bytes = await readFile("brand/tidi/original/identidad-chatgpt.png");
  assert.equal(isAiGenerated(bytes), true);
});

test("comprueba imágenes y vídeos de src/ y public/, salvo los de marca", () => {
  for (const file of [
    "src/assets/trabajos/benidorm/split-antes.jpg",
    "src/assets/galeria/bandeja.webp",
    "public/fotos/equipo.png",
    "public/video/limpieza.mp4",
    "src/assets/trabajos/HEIC/foto.HEIC",
  ]) {
    assert.equal(isCheckedMedia(file), true, file);
  }
  for (const file of [
    "src/assets/marca/tidi.png",
    "public/marca/avatar.webp",
    "public/logo.png",
    "public/og.png",
    "public/favicon.svg",
    "public/favicon.ico",
    "src/assets/trabajos/notas.md",
  ]) {
    assert.equal(isCheckedMedia(file), false, file);
  }
});

test("para la foto de un trabajo hecha con IA, no la de marca", () => {
  const ai = png(`${IPTC}trainedAlgorithmicMedia`);
  assert.deepEqual(
    checkMedia([
      { file: "src/assets/trabajos/split.png", bytes: ai },
      { file: "src/assets/trabajos/real.png", bytes: png() },
      { file: "src/assets/marca/tidi.png", bytes: ai },
      { file: "public/og.png", bytes: ai },
    ]).map((e) => e.split(":")[0]),
    ["src/assets/trabajos/split.png"],
  );
});
