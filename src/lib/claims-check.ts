import { decode } from "./seo-check.ts";

// Reglas de npm run check:claims (scripts/check-claims.mjs). Aquí, sin E/S,
// para poder probarlas.
//
// 1. Publicidad: sin inscripción en el ROESB no podemos anunciar desinfección
//    ni ningún efecto biocida (matar o eliminar microorganismos, hongos o
//    ácaros). Se busca en todo el texto publicado de dist/, en español e
//    inglés, también en atributos (alt, meta) y en el JSON-LD.
// 2. Imágenes: ninguna foto puede estar generada con IA. Se detecta por el
//    digitalSourceType de IPTC que llevan el manifiesto C2PA y el XMP
//    (trainedAlgorithmicMedia y compositeWithTrainedAlgorithmicMedia). Si se
//    quitan los metadatos, no se ve: la regla para los descuidos, no para
//    quien quiera saltársela.

export interface TextFile {
  /** Ruta relativa a dist/, con "/". */
  file: string;
  text: string;
}

export interface BinaryFile {
  /** Ruta relativa a la raíz del repositorio, con "/". */
  file: string;
  bytes: Uint8Array;
}

/** Ficheros de dist/ cuyo texto se publica (el CSS y el JS no). */
export const TEXT_EXTENSIONS = /\.(html|xml|txt|json|webmanifest|svg)$/i;

/** Imágenes y vídeos que pueden mostrar trabajos. */
export const MEDIA_EXTENSIONS =
  /\.(png|jpe?g|webp|avif|gif|tiff?|heic|heif|svg|mp4|m4v|mov|webm)$/i;

/**
 * Logos e ilustraciones de marca: pueden estar hechos con IA (la ilustración
 * de Ti&Di la generó ChatGPT, DESIGN.md). Una carpeta `marca/` en cualquier
 * sitio de src/ o public/, y los ficheros de marca de la raíz de public/.
 */
const BRAND = [
  /(^|\/)marca\//,
  /^public\/(favicon\.(ico|svg)|logo\.png|og\.png)$/,
];

/** Separadores de palabra dentro de una frase (no la cruzan . ; : ! ? ni etiquetas). */
const WORDS = (max: number) => `(?:[^ .;:!?<>]+ ){0,${max}}?`;

const KILL_VERB = [
  // Español
  String.raw`elimin\w*`,
  "mata|matan|matamos|matar",
  String.raw`destru\w*`,
  String.raw`erradic\w*`,
  String.raw`neutrali[sz]\w*`,
  String.raw`acab\w* con`,
  // Inglés (eliminate entra en elimin…)
  String.raw`kill\w*`,
  String.raw`destroy\w*`,
  String.raw`eradicat\w*`,
  "gets? rid of",
].join("|");

const ORGANISM = [
  String.raw`bacteri\w*`,
  String.raw`virus\w*`,
  String.raw`germ(?:s|en|enes)?`,
  String.raw`microbio\w*`,
  String.raw`microbes?`,
  String.raw`micro-?organism\w*`,
  String.raw`patogen\w*`,
  String.raw`pathogen\w*`,
  String.raw`hongos?`,
  String.raw`fung\w*`,
  String.raw`moho\w*`,
  String.raw`mou?lds?`,
  String.raw`acaros?`,
  String.raw`(?:dust )?mites?`,
].join("|");

export interface ClaimRule {
  /** Nombre para el mensaje de error. */
  name: string;
  /** Sobre texto normalizado: minúsculas, sin tildes y con espacios simples. */
  pattern: RegExp;
}

export const CLAIM_RULES: ClaimRule[] = [
  // desinfección, desinfectar, desinfecta, desinfectante, desinfectado…
  { name: "desinfección", pattern: /desinfec/ },
  // disinfect, disinfection, disinfectant, disinfecting…
  { name: "disinfection", pattern: /disinfect/ },
  // antibacteriano, antibacterial, anti-bacterial
  { name: "antibacteriano", pattern: /anti-?bacteri/ },
  { name: "antimicrobiano", pattern: /anti-?microb/ },
  // antiviral, antivírico
  { name: "antiviral", pattern: /anti-?vir(?:al|ic)/ },
  // antifúngico, antifungal, antifúngicos
  { name: "antifúngico", pattern: /anti-?fung/ },
  // bactericida, fungicida, virucida, viricida, germicida, microbicida y en
  // inglés bactericide, fungicidal, virucidal, germicide…
  {
    name: "biocida (-cida)",
    pattern: /\b(?:bacteri|fungi|viru|viri|germi|microbi)cid/,
  },
  // legionela, legionella, legionelosis, Legionnaires' disease
  { name: "legionela", pattern: /legionel|legionnaire/ },
  // 99,9 %, 99.9%, 99,99 %, 99,9 por ciento, 99.9 percent
  {
    name: "99,9 %",
    pattern: /\b99[.,]9+ ?(?:%|por ?ciento|percent)/,
  },
  // esterilizar, esterilización, sterilise, sterilization
  { name: "esterilización", pattern: /esteriliz|sterili[sz]/ },
  // higienizar, higienizante: el eufemismo habitual de desinfectar.
  // sanitize, sanitise, sanitizer
  { name: "higienización", pattern: /higieniz|saniti[sz]/ },
  // «elimina bacterias», «eliminamos el moho», «acaba con los virus»,
  // «kills 99% of germs», «eliminates mould»…
  {
    name: "elimina bacterias, virus, hongos…",
    pattern: new RegExp(
      String.raw`\b(?:${KILL_VERB}) ${WORDS(3)}(?:${ORGANISM})\b`,
    ),
  },
  // «libre de bacterias», «free from germs», «germ-free»
  {
    name: "libre de bacterias, virus, hongos…",
    pattern: new RegExp(
      String.raw`\b(?:libres? de|free (?:of|from)) ${WORDS(2)}(?:${ORGANISM})\b|\b(?:bacteria|germ|virus|mou?ld|fungus)-free\b`,
    ),
  },
];

/** Texto publicado de un fichero: sin CSS ni JS, con el JSON-LD y los atributos. */
export function publishedText(file: string, text: string): string {
  if (!/\.html?$/i.test(file)) return text;
  return text
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(
      /<script\b(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/gi,
      " ",
    );
}

/** Minúsculas, sin tildes, sin guiones blandos ni anchos cero, espacios simples. */
export function normalize(text: string): string {
  return decode(text)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[\u00ad\u200b-\u200d\u2060\ufeff]/g, "")
    .replace(/\s+/gu, " ")
    .toLowerCase();
}

/** Amplía [start, end) a palabras enteras: «desinfec» → «desinfectamos». */
function wordBounds(text: string, start: number, end: number): number[] {
  const word = /[\w-]/;
  while (start > 0 && word.test(text[start - 1]!)) start--;
  while (end < text.length && word.test(text[end]!)) end++;
  return [start, end];
}

/** Un trozo de HTML como texto: sin etiquetas, ni las cortadas en los bordes. */
function withoutTags(html: string): string {
  return html
    .replace(/^[^<]*>/, "")
    .replace(/<[^>]*(>|$)/g, " ")
    .replace(/ +/g, " ")
    .trim();
}

/** Afirmaciones prohibidas en el texto publicado de cada fichero. */
export function checkClaims(files: TextFile[]): string[] {
  const errors: string[] = [];
  for (const { file, text } of files) {
    const normalized = normalize(publishedText(file, text));
    for (const rule of CLAIM_RULES) {
      const global = new RegExp(rule.pattern.source, "g");
      for (const match of normalized.matchAll(global)) {
        const [start, end] = wordBounds(
          normalized,
          match.index,
          match.index + match[0].length,
        );
        const context = withoutTags(
          normalized.slice(Math.max(0, start - 40), end + 40),
        );
        errors.push(
          `${file}: ${rule.name} («${normalized.slice(start, end)}»): …${context}…`,
        );
      }
    }
  }
  return errors;
}

/** Valores de digitalSourceType de IPTC para contenido generado o retocado con IA. */
// trainedAlgorithmicMedia: generada entera. compositeWithTrainedAlgorithmicMedia:
// foto real con partes generadas (relleno generativo).
const AI_SOURCE_TYPES = [
  "trainedAlgorithmicMedia",
  "compositeWithTrainedAlgorithmicMedia",
].map((value) => Buffer.from(value));

/** ¿Declara el fichero (C2PA o XMP) que está generado o retocado con IA? */
export function isAiGenerated(bytes: Uint8Array): boolean {
  const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return AI_SOURCE_TYPES.some((value) => buffer.includes(value));
}

/** ¿Hay que comprobar este fichero? Imágenes y vídeos que no son de marca. */
export function isCheckedMedia(file: string): boolean {
  return MEDIA_EXTENSIONS.test(file) && !BRAND.some((re) => re.test(file));
}

/** Imágenes y vídeos que no son de marca y declaran estar hechos con IA. */
export function checkMedia(files: BinaryFile[]): string[] {
  return files
    .filter(({ file, bytes }) => isCheckedMedia(file) && isAiGenerated(bytes))
    .map(
      ({ file }) =>
        `${file}: generada con IA (C2PA o XMP trainedAlgorithmicMedia). Las fotos de trabajos tienen que ser reales; si es de marca, va en una carpeta marca/.`,
    );
}
