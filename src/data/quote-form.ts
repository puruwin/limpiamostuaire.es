import type { Locale } from "../i18n/locales.ts";

// Formulario de presupuesto (M3.2): única fuente de nombres, opciones y límites
// para la página (src/components/bloques/Formulario.astro), su JS y el
// endpoint (server/). Sin imports en tiempo de ejecución, para que el servicio
// Node pueda cargar este fichero tal cual. Viene del de rqpbioclean.es.
//
// Contrato con el endpoint:
// - POST multipart/form-data a QUOTE_ENDPOINT con los campos de `quoteFields`
//   y las fotos en `fotos` (varias partes con el mismo nombre).
// - Sin `Accept: application/json` (envío sin JS): responde 303 a la página de
//   resultado del idioma del campo `idioma` (`quoteResultPaths`).
// - Con `Accept: application/json` (envío con JS): 200 `{ "ok": true }`, o
//   4xx/5xx `{ "ok": false, "errors"?: { [campo]: código }, "error"?: código }`
//   con los códigos de `QuoteErrorCode` (por campo) y `QuoteFormError` (de
//   todo el envío). El JS muestra cada error junto a su campo.
// - El campo `web` es el honeypot: si llega con valor, es spam y el endpoint
//   responde como si lo hubiera enviado.
// - Turnstile añade `cf-turnstile-response`. Sin token válido no se envía
//   (sin JS no hay token: el formulario lo avisa con <noscript>).

export const QUOTE_ENDPOINT = "/api/presupuesto/";

/**
 * Clave pública de pruebas de Turnstile (siempre pasa): la de desarrollo y la
 * que se usa si falta PUBLIC_TURNSTILE_SITE_KEY. El build de producción no la
 * admite (src/integrations/production-guards.ts).
 * https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */
export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";

/** Nombres de los campos del formulario. */
export const quoteFields = {
  name: "nombre",
  phone: "telefono",
  email: "email",
  municipality: "municipio",
  municipalityOther: "municipio_otro",
  place: "tipo",
  splits: "splits",
  ducts: "conductos",
  outdoor: "exterior",
  photos: "fotos",
  message: "mensaje",
  privacy: "privacidad",
  locale: "idioma",
  origin: "origen",
  honeypot: "web",
  turnstile: "cf-turnstile-response",
} as const;

/** Casa o negocio. Mismos códigos que `?tipo=` en los enlaces al formulario. */
export const places = ["casa", "negocio"] as const;
export type Place = (typeof places)[number];

/** Respuestas de las preguntas de sí o no (conductos, unidad exterior). */
export const yesNo = ["si", "no"] as const;
export type YesNo = (typeof yesNo)[number];

/** Valor de «Otro» en la lista de municipios: el nombre va en `municipio_otro`. */
export const OTHER_MUNICIPALITY = "otro";

export const photoLimits = {
  maxFiles: 5,
  maxBytes: 10 * 1024 * 1024,
  types: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
} as const;

export const textLimits = {
  name: 100,
  phoneMin: 8,
  phoneMax: 20,
  email: 254,
  municipalityOther: 100,
  splitsMax: 200,
  message: 2000,
} as const;

/**
 * Días que se guardan las fotos en el servidor: lo que dice la política de
 * privacidad. Los enlaces del email caducan a la vez.
 */
export const PHOTO_RETENTION_DAYS = 30;

/** Errores de un campo (`errors`). */
export type QuoteErrorCode =
  "required" | "invalid" | "tooMany" | "tooLarge" | "fileType" | "server";

/** Errores de todo el envío (`error`). */
export type QuoteFormError = "turnstile" | "rateLimit" | "server";

/**
 * Páginas de resultado (src/pages/contacto/, src/pages/en/contact/). Sin JS,
 * el endpoint redirige a ellas; con JS, el envío correcto también. Son noindex
 * siempre y no van al sitemap (check:seo y check:robots).
 */
export const quoteResultPaths = {
  es: { sent: "/contacto/enviado/", error: "/contacto/error/" },
  en: { sent: "/en/contact/sent/", error: "/en/contact/error/" },
} as const satisfies Record<Locale, { sent: string; error: string }>;

/** Rutas de dist/ de las páginas de resultado ("contacto/enviado/index.html"). */
export const quoteResultFiles: readonly string[] = Object.values(
  quoteResultPaths,
).flatMap((paths) =>
  Object.values(paths).map((path) => `${path.slice(1)}index.html`),
);
