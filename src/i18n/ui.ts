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

  "cta.whatsapp": "Pide presupuesto por WhatsApp",
  "cta.call": "Llama al",

  "price.from": "Desde",
  "price.perSplit": "por split",
  "price.vatIncluded": "IVA incluido",
  "price.plusVat": "+ IVA, con factura",
  "price.home": "En casa",
  "price.business": "En negocios",
  "launch.title": "Precio de lanzamiento",
  "launch.body": "{price} un split en casa, IVA incluido, hasta el {date}.",
  "launch.more":
    "Si limpiamos más de uno en la misma visita, cada uno de los demás sale a {price}.",
  "launch.example": "Hasta el {date}, con el precio de lanzamiento: {total}.",

  "table.caption": "Precio de una visita según el número de splits",
  "table.concept": "Splits en la misma visita",
  "table.splits.one": "1 split",
  "table.splits.other": "{count} splits",
  "table.additional": "Cada split más, a partir del cuarto",
  "table.extras": "Suplementos",
  "table.outdoor": "Unidad exterior sin trabajar en altura, cada una",
  "table.outside": "Fuera de nuestros municipios, por visita",

  "quote.concept": "Concepto",
  "quote.amount": "Importe",
  "quote.splits.one": "Limpieza de 1 split",
  "quote.splits.other": "Limpieza de {count} splits",
  "quote.launch": "Primer split, a precio de lanzamiento",
  "quote.additional.one": "1 split más, a {price}",
  "quote.additional.other": "{count} splits más, a {price} cada uno",
  "quote.outdoor.one": "1 unidad exterior, a {price}",
  "quote.outdoor.other": "{count} unidades exteriores, a {price} cada una",
  "quote.outside": "Desplazamiento fuera de nuestros municipios",
  "quote.total": "Total",

  "areas.label": "Municipios donde trabajamos",

  "works.before": "Antes",
  "works.after": "Después",
  "works.pending":
    "{{PENDIENTE: fotos de antes y después de trabajos reales, con municipio (M0.4)}}",
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

  "cta.whatsapp": "Get a quote on WhatsApp",
  "cta.call": "Call",

  "price.from": "From",
  "price.perSplit": "per split unit",
  "price.vatIncluded": "VAT included",
  "price.plusVat": "+ VAT, with invoice",
  "price.home": "At home",
  "price.business": "For businesses",
  "launch.title": "Launch price",
  "launch.body":
    "{price} for one split unit at home, VAT included, until {date}.",
  "launch.more":
    "If we clean more than one on the same visit, each of the others is {price}.",
  "launch.example": "Until {date}, with the launch price: {total}.",

  "table.caption": "Price of one visit by number of split units",
  "table.concept": "Split units on the same visit",
  "table.splits.one": "1 split unit",
  "table.splits.other": "{count} split units",
  "table.additional": "Each extra unit, from the fourth on",
  "table.extras": "Extras",
  "table.outdoor": "Outdoor unit reachable without working at height, each",
  "table.outside": "Outside our towns, per visit",

  "quote.concept": "Item",
  "quote.amount": "Amount",
  "quote.splits.one": "Cleaning of 1 split unit",
  "quote.splits.other": "Cleaning of {count} split units",
  "quote.launch": "First split unit, at the launch price",
  "quote.additional.one": "1 more split unit, at {price}",
  "quote.additional.other": "{count} more split units, at {price} each",
  "quote.outdoor.one": "1 outdoor unit, at {price}",
  "quote.outdoor.other": "{count} outdoor units, at {price} each",
  "quote.outside": "Travel outside our towns",
  "quote.total": "Total",

  "areas.label": "Towns we cover",

  "works.before": "Before",
  "works.after": "After",
  "works.pending":
    "{{PENDIENTE: before and after photos of real jobs, with the town (M0.4)}}",
};

export const ui = { es, en } satisfies Record<Locale, Record<UiKey, string>>;

/** Devuelve `t(clave)` con las cadenas del idioma. */
export function useTranslations(locale: Locale) {
  return (key: UiKey): string => ui[locale][key];
}
