import type { Locale } from "../i18n/locales.ts";
import type { ContactSpot } from "./contact-check.ts";
import { SITE } from "./site.ts";

// Medición con Umami Cloud (M3.3): sin cookies ni IP (privacidad y cookies lo
// cuentan). Tres eventos, todos con idioma, página y ubicación:
// - telefono y whatsapp: al pulsar un enlace con data-contacto. Los registra
//   el script de Umami por los atributos data-umami-event (contactAttrs).
// - formulario: al enviarse bien el presupuesto, desde el JS del formulario
//   (src/components/bloques/Formulario.astro). Su página es la de origen, la
//   que llevó al formulario.
// npm run check:contact comprueba los atributos (src/lib/contact-check.ts).

export const UMAMI_SCRIPT = "https://cloud.umami.is/script.js";

/**
 * Único host que envía datos (data-domains): staging, local y cualquier copia
 * cargan el script pero no cuentan visitas.
 */
export const UMAMI_DOMAIN = new URL(SITE).host;

export const UMAMI_EVENTS = ["telefono", "whatsapp", "formulario"] as const;
export type UmamiEvent = (typeof UMAMI_EVENTS)[number];

/** Datos de cada evento; en Umami, «propiedades» del evento. */
export interface UmamiEventData {
  idioma: Locale;
  /** Ruta de la página, como /benidorm/ o /en/. */
  pagina: string;
  /** Sitio del enlace (data-contacto) o "formulario". */
  ubicacion: string;
}

/**
 * Atributos de un enlace de contacto: data-contacto con su sitio y los
 * data-umami-event con los que Umami registra el clic.
 */
export function contactAttrs(
  event: "telefono" | "whatsapp",
  spot: ContactSpot,
  locale: Locale,
  path: string,
): Record<string, string> {
  return {
    "data-contacto": spot,
    "data-umami-event": event,
    "data-umami-event-idioma": locale,
    "data-umami-event-pagina": path,
    "data-umami-event-ubicacion": spot,
  };
}
