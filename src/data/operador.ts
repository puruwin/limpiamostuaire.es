import avatar from "../../brand/tidi/png/avatar-512.png";
import wordmark from "../../brand/tidi/wordmark.svg";
import wordmarkBlanco from "../../brand/tidi/wordmark-blanco.svg";
import type { Locale } from "../i18n/locales.ts";
import type { NavKey } from "../lib/collection.ts";
import { business } from "./business.ts";

// Operador local de la marca: quién atiende en la zona. Lo usan la plantilla
// «operador» (src/templates/Operador.astro), el pie y el LocalBusiness del
// JSON-LD (su url es la página del operador). Para otro operador (M7.2) se
// cambian este fichero y business.ts, no la plantilla.
// El avatar y el wordmark son de marca (DESIGN.md): la ilustración la generó
// ChatGPT, así que solo va como logo, nunca en lugar de una foto real.
export const operador = {
  nombre: business.operator,
  localidad: business.locality,
  equipo: ["Tamar", "David"],
  /** translationKey de su página (/benidorm/). */
  pagina: "benidorm" satisfies NavKey,
  avatar: {
    src: avatar,
    alt: {
      es: "Logo de Ti&Di: ilustración de Tamar y David",
      en: "Ti&Di logo: illustration of Tamar and David",
    } satisfies Record<Locale, string>,
  },
  /** Sobre fondo claro. */
  wordmark,
  /** Sobre tinta (pie). */
  wordmarkBlanco,
} as const;
