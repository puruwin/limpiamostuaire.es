import type { Locale } from "../i18n/locales.ts";
import { useTranslations } from "../i18n/ui.ts";

// Datos del negocio: única fuente para la cabecera, el pie y los datos
// estructurados (src/lib/structured-data.ts). Tienen que coincidir carácter a
// carácter con la ficha de Google de Ti&Di (docs/ficha-google.md): si cambian
// allí, se cambian aquí.
// Negocio de área de servicio con la dirección oculta: solo localidad.
export const business = {
  brand: "Limpiamos tu aire",
  /** Operador en Benidorm; no va en la cabecera (DESIGN.md). */
  operator: "Ti&Di",
  /**
   * Titular de la web y responsable de los datos (aviso legal y privacidad:
   * LSSI art. 10 y RGPD art. 13). Mientras lleven {{PENDIENTE, el build de
   * producción falla. El domicilio va solo aquí: la ficha lo oculta.
   */
  titular: {
    nombre:
      "{{PENDIENTE: nombre y apellidos del autónomo, o razón social y forma jurídica}}",
    nif: "{{PENDIENTE: NIF}}",
    domicilio: "{{PENDIENTE: domicilio fiscal completo, con código postal}}",
  },
  phone: { display: "+34 608 96 22 13", e164: "+34608962213" },
  email: "hola@limpiamostuaire.es",
  locality: "Benidorm",
  region: "Alicante",
  country: "ES",
  /** Enlace para compartir de la ficha (sameAs del LocalBusiness). */
  googleBusinessUrl: "https://share.google/W0LGnOaaaB6GDUrih",
  /** Lunes a viernes; sábado y domingo, cerrado. */
  hours: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "08:00",
    closes: "20:00",
  },
  areaServed: [
    "Benidorm",
    "Finestrat",
    "La Vila Joiosa",
    "La Nucía",
    "Polop",
    "Callosa d'en Sarrià",
    "Calp",
    "L'Alfàs del Pi",
    "Altea",
  ],
} as const;

export function telHref(): string {
  return `tel:${business.phone.e164}`;
}

/**
 * Enlace a WhatsApp con el saludo genérico en el idioma de la página. El
 * saludo por página llega en M3.1 (parámetro `greeting`).
 */
export function whatsappHref(locale: Locale, greeting?: string): string {
  const text = greeting ?? useTranslations(locale)("whatsapp.greeting");
  return `https://wa.me/${business.phone.e164.slice(1)}?text=${encodeURIComponent(text)}`;
}
