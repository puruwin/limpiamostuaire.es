import type { Locale } from "./locales.ts";

// Cadenas de interfaz. `es` define las claves; a `en` no le puede faltar ni
// sobrar ninguna: si pasa, `npm run check` falla.

const es = {
  "site.name": "Limpiamos tu aire",
  "a11y.skipToContent": "Saltar al contenido",
  "seo.ogImageAlt": "Logo de Limpiamos tu aire",
  "breadcrumb.home": "Inicio",
  "notFound.title": "Página no encontrada",
  "notFound.description":
    "La página que buscas no existe o ha cambiado de dirección.",
  "notFound.h1": "No encontramos esta página",
  "notFound.body":
    "Puede que la dirección esté mal escrita o que la página ya no exista. Desde aquí puedes seguir:",
  "notFound.home": "Ir al inicio",
  "schema.serviceType": "Limpieza de aire acondicionado",
  "schema.offerCatalog": "Tarifa de limpieza de splits",
  "schema.paymentAccepted": "Efectivo, Bizum",

  "nav.label": "Menú principal",
  "nav.open": "Abrir el menú",
  "nav.close": "Cerrar el menú",
  "nav.precios": "Precios",
  "nav.como-lo-hacemos": "Cómo lo hacemos",
  "nav.negocios": "Negocios",
  "nav.conductos": "Conductos",
  "nav.apartamentos-turisticos": "Apartamentos turísticos",
  "nav.benidorm": "Benidorm",
  "nav.sobre-nosotros": "Sobre nosotros",
  "nav.aviso-legal": "Aviso legal",
  "nav.privacidad": "Privacidad",
  "nav.cookies": "Cookies",

  "header.call": "Llámanos",
  "header.whatsapp": "WhatsApp",
  "header.whatsappLabel": "Escríbenos por WhatsApp",
  "whatsapp.greeting":
    "Hola, quiero pedir presupuesto para limpiar mi aire acondicionado.",

  "lang.switcher": "Idioma",
  "lang.es": "Español",
  "lang.en": "English",

  "footer.contact": "Contacto",
  "footer.operator": "En Benidorm te atiende",
  "footer.hours": "De lunes a viernes, de 8:00 a 20:00",
  "footer.areas": "Zonas",
  "footer.areasIntro": "Limpiamos aires acondicionados en",
  "footer.pages": "Servicios",
  "footer.legal": "Información legal",
};

export type UiKey = keyof typeof es;

const en = {
  "site.name": "Limpiamos tu aire",
  "a11y.skipToContent": "Skip to content",
  "seo.ogImageAlt": "Limpiamos tu aire logo",
  "breadcrumb.home": "Home",
  "notFound.title": "Page not found",
  "notFound.description":
    "The page you are looking for does not exist or has moved.",
  "notFound.h1": "We can't find this page",
  "notFound.body":
    "The address may be mistyped or the page may no longer exist. You can carry on from here:",
  "notFound.home": "Go to the home page",
  "schema.serviceType": "Air conditioner cleaning",
  "schema.offerCatalog": "Split unit cleaning prices",
  "schema.paymentAccepted": "Cash, Bizum",

  "nav.label": "Main menu",
  "nav.open": "Open menu",
  "nav.close": "Close menu",
  "nav.precios": "Prices",
  "nav.como-lo-hacemos": "How we do it",
  "nav.negocios": "Businesses",
  "nav.conductos": "Ducts",
  "nav.apartamentos-turisticos": "Holiday lets",
  "nav.benidorm": "Benidorm",
  "nav.sobre-nosotros": "About us",
  "nav.aviso-legal": "Legal notice",
  "nav.privacidad": "Privacy",
  "nav.cookies": "Cookies",

  "header.call": "Call us",
  "header.whatsapp": "WhatsApp",
  "header.whatsappLabel": "Message us on WhatsApp",
  "whatsapp.greeting": "Hi, I'd like a quote for cleaning my air conditioner.",

  "lang.switcher": "Language",
  "lang.es": "Español",
  "lang.en": "English",

  "footer.contact": "Contact",
  "footer.operator": "In Benidorm, your local team is",
  "footer.hours": "Monday to Friday, 8:00 to 20:00",
  "footer.areas": "Areas",
  "footer.areasIntro": "We clean air conditioners in",
  "footer.pages": "Services",
  "footer.legal": "Legal information",
};

export const ui = { es, en } satisfies Record<Locale, Record<UiKey, string>>;

/** Devuelve `t(clave)` con las cadenas del idioma. */
export function useTranslations(locale: Locale) {
  return (key: UiKey): string => ui[locale][key];
}
