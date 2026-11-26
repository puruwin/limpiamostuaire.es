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
   * LSSI art. 10 y RGPD art. 13). El domicilio va solo aquí: la ficha lo
   * oculta.
   */
  titular: {
    nombre: "David Pérez Martínez",
    nif: "49234343Z",
    domicilio: "Calle Serreta 19, 03520 Polop (Alicante), España",
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

/** Tema del saludo de WhatsApp: qué pide quien escribe. */
export const whatsappTopics = [
  "casa",
  "negocio",
  "apartamento",
  "conductos",
] as const;
export type WhatsAppTopic = (typeof whatsappTopics)[number];

/**
 * Páginas (translationKey) con su propio saludo. Las demás (home, precios,
 * legales, 404…) usan el de casa, el más general.
 */
const topicByPage: Readonly<Record<string, WhatsAppTopic>> = {
  negocios: "negocio",
  "apartamentos-turisticos": "apartamento",
  conductos: "conductos",
};

export function whatsappTopic(translationKey?: string): WhatsAppTopic {
  return (translationKey && topicByPage[translationKey]) || "casa";
}

/** Texto con el que se abre el chat de WhatsApp en esa página. */
export function whatsappGreeting(
  locale: Locale,
  translationKey?: string,
): string {
  return useTranslations(locale)(
    `whatsapp.greeting.${whatsappTopic(translationKey)}`,
  );
}

/**
 * Enlace a WhatsApp con el saludo de la página en su idioma. Lo usan la
 * cabecera, el botón flotante y los botones de las CTA; check:contact
 * comprueba que en cada página de dist/ lleven el mismo texto.
 */
export function whatsappHref(locale: Locale, translationKey?: string): string {
  const text = whatsappGreeting(locale, translationKey);
  return `https://wa.me/${business.phone.e164.slice(1)}?text=${encodeURIComponent(text)}`;
}
