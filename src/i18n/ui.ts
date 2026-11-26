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
  "whatsapp.greeting.casa":
    "Hola, quiero pedir presupuesto para limpiar mi aire acondicionado.",
  "whatsapp.greeting.negocio":
    "Hola, quiero pedir presupuesto para limpiar los aires acondicionados de mi negocio.",
  "whatsapp.greeting.apartamento":
    "Hola, quiero pedir presupuesto para limpiar el aire acondicionado de mi apartamento turístico.",
  "whatsapp.greeting.conductos":
    "Hola, quiero pedir presupuesto para limpiar los conductos de mi aire acondicionado.",

  "lang.switcher": "Idioma",
  "lang.es": "Español",
  "lang.en": "English",

  "footer.contact": "Contacto",
  "footer.hours": "De lunes a viernes, de 8:00 a 20:00",
  "footer.areas": "Zonas",
  "footer.areasIntro": "Limpiamos aires acondicionados en",
  "footer.pages": "Servicios",
  "footer.legal": "Información legal",
  "footer.quoteForm": "Formulario de presupuesto",

  "cta.whatsapp": "Pide presupuesto por WhatsApp",
  "cta.call": "Llama al",

  "cta.form":
    "¿Prefieres mandarnos fotos con los datos? Rellena el formulario de presupuesto",

  "form.optional": "opcional",
  "form.name": "Nombre",
  "form.phone": "Teléfono",
  "form.phoneHint": "Te llamamos o te escribimos por WhatsApp a este número.",
  "form.email": "Email",
  "form.emailHint": "Si lo dejas, te mandamos una copia de tu solicitud.",
  "form.municipality": "Municipio",
  "form.municipalityChoose": "Elige un municipio",
  "form.municipalityOther": "Otro",
  "form.municipalityOtherLabel": "Si es otro municipio, ¿cuál?",
  "form.place": "¿Es en casa o en un negocio?",
  "form.place.casa": "En casa",
  "form.place.negocio": "En un negocio",
  "form.placeHint":
    "En casa, el precio lleva el IVA incluido; a los negocios les facturamos con IVA aparte.",
  "form.splits": "¿Cuántos splits hay que limpiar?",
  "form.splitsHint": "Cuenta los aparatos de dentro, los que van en la pared.",
  "form.ducts": "¿Tienes aire por conductos?",
  "form.ductsHint":
    "Rejillas en el techo o en las paredes en vez de un aparato en cada habitación.",
  "form.outdoor": "¿Se llega a la unidad exterior sin trabajar en altura?",
  "form.outdoorHint":
    "Por ejemplo, si está en una terraza o en el suelo y no colgada de la fachada. Así también la podemos limpiar.",
  "form.yes": "Sí",
  "form.no": "No",
  "form.photos": "Fotos de los aparatos",
  "form.photosHint":
    "Hasta {max} fotos (JPG, PNG, WebP o HEIC) de {mb} MB como máximo cada una: de los splits y, si quieres que limpiemos la exterior, de dónde está. Que salga solo el aparato, sin personas ni documentos.",
  // Botón propio para las fotos: el del navegador sale en su idioma.
  "form.photosChoose": "Elegir fotos",
  "form.photosNone": "Ninguna foto elegida",
  "form.photosOne": "1 foto elegida",
  "form.photosMany": "{n} fotos elegidas",
  "form.message": "Mensaje",
  "form.messageHint":
    "Lo que quieras contarnos: la marca o el estado de los aparatos, cuándo te viene bien…",
  "form.privacyBefore": "He leído la",
  "form.privacyLink": "política de privacidad",
  "form.privacyAfter":
    "y acepto que se usen mis datos para responder a mi solicitud.",
  "form.privacyInfo":
    "Responsable: {holder}. Finalidad: preparar y enviarte el presupuesto. Puedes acceder a tus datos, corregirlos o borrarlos escribiendo a {email}.",
  "form.privacyPending":
    "{{PENDIENTE: política de privacidad en este idioma (M4.1)}}",
  "form.honeypot": "No rellenes este campo",
  "form.submit": "Enviar solicitud",
  "form.sending": "Enviando…",
  "form.errorSummary": "Revisa los campos con error antes de enviar.",
  "form.error.required": "Este campo es obligatorio.",
  "form.error.choose": "Elige una opción.",
  "form.error.privacy":
    "Para enviar la solicitud tienes que aceptar la política de privacidad.",
  "form.error.email":
    "Escribe un email válido, por ejemplo nombre@ejemplo.com.",
  "form.error.phone":
    "Escribe un teléfono válido, con el prefijo del país si no es español.",
  "form.error.splits": "Escribe un número entre 1 y {max}.",
  "form.error.tooLong": "Es demasiado largo: {max} caracteres como máximo.",
  "form.error.tooMany": "Puedes subir {max} fotos como máximo.",
  "form.error.tooLarge": "Cada foto puede ocupar {mb} MB como máximo.",
  "form.error.fileType": "Solo se admiten fotos JPG, PNG, WebP o HEIC.",
  "form.error.invalid": "Revisa este campo.",
  "form.error.send":
    "No hemos podido enviar tu solicitud. Inténtalo de nuevo en unos minutos, o escríbenos por WhatsApp o llámanos.",
  "form.error.turnstile":
    "No hemos podido comprobar que no eres un robot. Espera unos segundos y vuelve a enviar la solicitud.",
  "form.error.rateLimit":
    "Has enviado varias solicitudes seguidas. Espera un rato, o escríbenos por WhatsApp o llámanos.",
  "form.noscript":
    "Para enviar el formulario hace falta JavaScript. Si lo tienes desactivado, llámanos o escríbenos por WhatsApp: por ahí también nos puedes mandar las fotos.",

  "email.ack.subject": "Hemos recibido tu solicitud · Limpiamos tu aire",
  "email.ack.greeting": "Hola, {name}:",
  "email.ack.text":
    "Gracias por pedirnos presupuesto. Te contestamos lo antes posible por teléfono o por WhatsApp.",
  "email.ack.copy": "Esta es una copia de lo que nos has enviado:",
  "email.ack.contact":
    "Si quieres añadir algo, responde a este email o escríbenos por WhatsApp al {phone}.",

  "quoteResult.sent.title": "Solicitud enviada · Limpiamos tu aire",
  "quoteResult.sent.description":
    "Hemos recibido tu solicitud de presupuesto de limpieza de aire acondicionado.",
  "quoteResult.sent.h1": "Hemos recibido tu solicitud",
  "quoteResult.sent.text":
    "Gracias. Te contestamos lo antes posible por teléfono o por WhatsApp, o por email si nos lo has dejado.",
  "quoteResult.error.title": "Solicitud no enviada · Limpiamos tu aire",
  "quoteResult.error.description":
    "No hemos podido enviar tu solicitud de presupuesto.",
  "quoteResult.error.h1": "No hemos podido enviar tu solicitud",
  "quoteResult.error.text":
    "Ha habido un problema al enviarla. Vuelve al formulario e inténtalo de nuevo (las fotos tendrás que elegirlas otra vez), o escríbenos por WhatsApp o llámanos.",
  "quoteResult.back": "Volver al formulario",
  "quoteResult.home": "Ir al inicio",

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

  "operator.servedBy": "En {locality} te atiende",
  "operator.team": "Somos",
  "operator.phone": "Teléfono y WhatsApp",
  "operator.hours": "Horario",
  "operator.areas": "Municipios",

  "reviews.title": "Lo que dicen nuestros clientes",
  "reviews.more": "Todas las reseñas en Google",

  "works.before": "Antes",
  "works.after": "Después",
  "works.pending":
    "{{PENDIENTE: fotos de antes y después de trabajos reales, con municipio (M0.4)}}",

  "steps.photo": "Foto del paso",
  "steps.pending": "{{PENDIENTE: foto propia de este paso (M0.4)}}",

  "legal.updated": "Última actualización: {date}.",
  "legal.holder": "Titular",
  "legal.tradeNames": "Nombres comerciales",
  "legal.nif": "NIF",
  "legal.address": "Domicilio",
  "legal.email": "Email",
  "legal.phone": "Teléfono",
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
  "whatsapp.greeting.casa":
    "Hi, I'd like a quote for cleaning my air conditioner.",
  "whatsapp.greeting.negocio":
    "Hi, I'd like a quote for cleaning the air conditioners at my business.",
  "whatsapp.greeting.apartamento":
    "Hi, I'd like a quote for cleaning the air conditioning in my holiday let.",
  "whatsapp.greeting.conductos":
    "Hi, I'd like a quote for cleaning my air conditioning ducts.",

  "lang.switcher": "Language",
  "lang.es": "Español",
  "lang.en": "English",

  "footer.contact": "Contact",
  "footer.hours": "Monday to Friday, 8:00 to 20:00",
  "footer.areas": "Areas",
  "footer.areasIntro": "We clean air conditioners in",
  "footer.pages": "Services",
  "footer.legal": "Legal information",
  "footer.quoteForm": "Quote form",

  "cta.whatsapp": "Get a quote on WhatsApp",
  "cta.call": "Call",

  "cta.form":
    "Would you rather send us photos and details? Fill in the quote form",

  "form.optional": "optional",
  "form.name": "Name",
  "form.phone": "Phone",
  "form.phoneHint":
    "We will call you or message you on WhatsApp at this number.",
  "form.email": "Email",
  "form.emailHint": "If you leave it, we will send you a copy of your request.",
  "form.municipality": "Town",
  "form.municipalityChoose": "Choose a town",
  "form.municipalityOther": "Other",
  "form.municipalityOtherLabel": "If it is another town, which one?",
  "form.place": "Is it at home or at a business?",
  "form.place.casa": "At home",
  "form.place.negocio": "At a business",
  "form.placeHint":
    "At home, the price includes VAT; businesses get an invoice with VAT added.",
  "form.splits": "How many split units need cleaning?",
  "form.splitsHint": "Count the indoor units, the ones on the wall.",
  "form.ducts": "Do you have ducted air conditioning?",
  "form.ductsHint":
    "Grilles in the ceiling or walls instead of a unit in each room.",
  "form.outdoor": "Can the outdoor unit be reached without working at height?",
  "form.outdoorHint":
    "For example, if it is on a terrace or on the ground rather than hanging on the front of the building. Then we can clean it too.",
  "form.yes": "Yes",
  "form.no": "No",
  "form.photos": "Photos of the units",
  "form.photosHint":
    "Up to {max} photos (JPG, PNG, WebP or HEIC), {mb} MB maximum each: of the split units and, if you want us to clean the outdoor unit, of where it is. Please show only the unit, with no people or documents.",
  "form.photosChoose": "Choose photos",
  "form.photosNone": "No photos chosen",
  "form.photosOne": "1 photo chosen",
  "form.photosMany": "{n} photos chosen",
  "form.message": "Message",
  "form.messageHint":
    "Anything you want to tell us: the make or condition of the units, when suits you…",
  "form.privacyBefore": "I have read the",
  "form.privacyLink": "privacy policy",
  "form.privacyAfter":
    "and agree that my data will be used to reply to my request.",
  "form.privacyInfo":
    "Data controller: {holder}. Purpose: preparing and sending you the quote. You can access, correct or delete your data by writing to {email}.",
  "form.privacyPending":
    "{{PENDIENTE: privacy policy in this language (M4.1)}}",
  "form.honeypot": "Do not fill in this field",
  "form.submit": "Send request",
  "form.sending": "Sending…",
  "form.errorSummary": "Please check the fields with errors before sending.",
  "form.error.required": "This field is required.",
  "form.error.choose": "Please choose an option.",
  "form.error.privacy":
    "To send the request you need to accept the privacy policy.",
  "form.error.email": "Enter a valid email, for example name@example.com.",
  "form.error.phone":
    "Enter a valid phone number, with the country code if it is not Spanish.",
  "form.error.splits": "Enter a number between 1 and {max}.",
  "form.error.tooLong": "This is too long: {max} characters maximum.",
  "form.error.tooMany": "You can upload {max} photos at most.",
  "form.error.tooLarge": "Each photo can be {mb} MB at most.",
  "form.error.fileType": "Only JPG, PNG, WebP or HEIC photos are accepted.",
  "form.error.invalid": "Please check this field.",
  "form.error.send":
    "We couldn't send your request. Please try again in a few minutes, or message us on WhatsApp or call us.",
  "form.error.turnstile":
    "We couldn't check that you are not a robot. Please wait a few seconds and send the request again.",
  "form.error.rateLimit":
    "You have sent several requests in a row. Please wait a while, or message us on WhatsApp or call us.",
  "form.noscript":
    "You need JavaScript to send this form. If it is turned off, call us or message us on WhatsApp: you can also send us the photos there.",

  "email.ack.subject": "We have received your request · Limpiamos tu aire",
  "email.ack.greeting": "Hello {name},",
  "email.ack.text":
    "Thank you for asking us for a quote. We will get back to you as soon as possible by phone or WhatsApp.",
  "email.ack.copy": "This is a copy of what you sent us:",
  "email.ack.contact":
    "If you want to add anything, reply to this email or message us on WhatsApp at {phone}.",

  "quoteResult.sent.title": "Request sent · Limpiamos tu aire",
  "quoteResult.sent.description":
    "We have received your air conditioner cleaning quote request.",
  "quoteResult.sent.h1": "We have received your request",
  "quoteResult.sent.text":
    "Thank you. We will get back to you as soon as possible by phone or WhatsApp, or by email if you left it.",
  "quoteResult.error.title": "Request not sent · Limpiamos tu aire",
  "quoteResult.error.description": "We couldn't send your quote request.",
  "quoteResult.error.h1": "We couldn't send your request",
  "quoteResult.error.text":
    "Something went wrong while sending it. Go back to the form and try again (you will need to choose the photos again), or message us on WhatsApp or call us.",
  "quoteResult.back": "Back to the form",
  "quoteResult.home": "Go to the home page",

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

  "operator.servedBy": "In {locality}, your local team is",
  "operator.team": "We are",
  "operator.phone": "Phone and WhatsApp",
  "operator.hours": "Hours",
  "operator.areas": "Towns",

  "reviews.title": "What our customers say",
  "reviews.more": "All our reviews on Google",

  "works.before": "Before",
  "works.after": "After",
  "works.pending":
    "{{PENDIENTE: before and after photos of real jobs, with the town (M0.4)}}",

  "steps.photo": "Photo of this step",
  "steps.pending": "{{PENDIENTE: our own photo of this step (M0.4)}}",

  "legal.updated": "Last updated: {date}.",
  "legal.holder": "Owner",
  "legal.tradeNames": "Trading names",
  "legal.nif": "Tax ID (NIF)",
  "legal.address": "Address",
  "legal.email": "Email",
  "legal.phone": "Phone",
};

export const ui = { es, en } satisfies Record<Locale, Record<UiKey, string>>;

/** Devuelve `t(clave)` con las cadenas del idioma. */
export function useTranslations(locale: Locale) {
  return (key: UiKey): string => ui[locale][key];
}
