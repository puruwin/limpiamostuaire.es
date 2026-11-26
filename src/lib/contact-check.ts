import { business, whatsappGreeting } from "../data/business.ts";
import { localeOf, tags, urlPath, type HtmlFile } from "./seo-check.ts";

// Reglas de npm run check:contact (scripts/check-contact.mjs) sobre el HTML
// de dist/. Sin E/S, para poder probarlas. Los enlaces de contacto que
// importan llevan data-contacto con el sitio donde van:
// - "cabecera": teléfono y WhatsApp de la cabecera (src/components/Header.astro).
// - "flotante": el botón de WhatsApp de móvil (WhatsAppFloat.astro).
// - "cta": WhatsApp y teléfono de las llamadas a la acción (bloques/Botones.astro).

export const CONTACT_SPOTS = ["cabecera", "flotante", "cta"] as const;

/** Lo que el check sabe de cada página de la colección, por su URL. */
export interface ContactPage {
  translationKey: string;
  /** Si la página tiene que llevar CTA (plantillas home, pagina y operador). */
  cta: boolean;
}

interface ContactLink {
  href: string;
  spot: string | undefined;
  inHeader: boolean;
}

const isWhatsApp = (href: string) =>
  /^whatsapp:|\/\/(?:[a-z0-9-]+\.)*(?:wa\.me|whatsapp\.com)(?:[/?#]|$)/i.test(
    href,
  );

function contactLinks(html: string): ContactLink[] {
  const header = /<header\b[\s\S]*?<\/header>/i.exec(html);
  const headerStart = header?.index ?? -1;
  const headerEnd = header ? headerStart + header[0].length : -1;
  return [...html.matchAll(/<a\b([^>]*)>/gi)].flatMap((match) => {
    const attrs = tags(match[0], "a")[0]!;
    const href = attrs.get("href");
    if (href === undefined) return [];
    if (!href.startsWith("tel:") && !isWhatsApp(href)) return [];
    return [
      {
        href,
        spot: attrs.get("data-contacto"),
        inHeader: match.index >= headerStart && match.index < headerEnd,
      },
    ];
  });
}

/** Problema del enlace de WhatsApp, o undefined si está bien. */
function whatsappProblem(href: string, text: string): string | undefined {
  const number = business.phone.e164.slice(1);
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return `${href}: no es una URL válida`;
  }
  if (url.protocol !== "https:" || url.host !== "wa.me") {
    return `${href}: tiene que ser https://wa.me/${number}`;
  }
  if (url.pathname !== `/${number}`) {
    return `${href}: el número no es el de business.ts (${number})`;
  }
  const actual = url.searchParams.get("text");
  if (actual === null) return `${href}: sin ?text= con el saludo`;
  if (actual !== text) {
    return `WhatsApp con el texto «${actual}», no «${text}»`;
  }
  return undefined;
}

/**
 * Errores de los enlaces de contacto de cada página:
 * - Todos los tel: son el teléfono de business.ts.
 * - Todos los de WhatsApp son https://wa.me/<número>?text= con el saludo de
 *   la página en su idioma (whatsappGreeting); las 404, el de casa.
 * - En la cabecera, teléfono y WhatsApp; un solo botón flotante de WhatsApp.
 * - En las páginas con CTA, WhatsApp y teléfono en cada una.
 */
export function checkContact(
  pages: HtmlFile[],
  collection: ReadonlyMap<string, ContactPage>,
): string[] {
  const errors: string[] = [];
  const tel = `tel:${business.phone.e164}`;

  for (const { file, html } of pages) {
    const path = urlPath(file);
    const page = collection.get(path);
    const text = whatsappGreeting(localeOf(path), page?.translationKey);
    const links = contactLinks(html);
    const error = (message: string) => errors.push(`${file}: ${message}.`);

    for (const link of links) {
      if (link.href.startsWith("tel:")) {
        if (link.href !== tel) error(`${link.href} no es ${tel}`);
      } else {
        const problem = whatsappProblem(link.href, text);
        if (problem) error(problem);
      }
      if (
        link.spot !== undefined &&
        !(CONTACT_SPOTS as readonly string[]).includes(link.spot)
      ) {
        error(`data-contacto="${link.spot}" desconocido`);
      }
      if ((link.spot === "cabecera") !== link.inHeader) {
        error(
          link.inHeader
            ? `${link.href} en la cabecera sin data-contacto="cabecera"`
            : `${link.href} con data-contacto="cabecera" fuera de la cabecera`,
        );
      }
    }

    const count = (spot: string, kind: "tel" | "whatsapp") =>
      links.filter(
        (l) =>
          l.spot === spot && l.href.startsWith("tel:") === (kind === "tel"),
      ).length;

    if (count("cabecera", "tel") === 0) error("sin teléfono en la cabecera");
    if (count("cabecera", "whatsapp") === 0) {
      error("sin WhatsApp en la cabecera");
    }
    if (count("flotante", "tel") > 0)
      error('teléfono con data-contacto="flotante"');
    const floating = count("flotante", "whatsapp");
    if (floating !== 1) {
      error(`${floating} botones flotantes de WhatsApp, y tiene que haber 1`);
    }

    const ctaTel = count("cta", "tel");
    const ctaWhatsApp = count("cta", "whatsapp");
    if (page?.cta && ctaWhatsApp === 0) error("sin CTA de WhatsApp");
    if (ctaWhatsApp !== ctaTel) {
      error(
        `${ctaWhatsApp} WhatsApp y ${ctaTel} teléfonos en las CTA: cada CTA lleva los dos`,
      );
    }
  }

  return errors;
}

/**
 * Datos de una página desde el frontmatter de su Markdown: locale, slug,
 * translationKey y template, que son valores de una línea (el esquema de
 * src/content.config.ts no deja otra cosa). Undefined si falta alguno.
 */
export function frontmatterPage(
  source: string,
):
  | { locale: string; slug: string; translationKey: string; template: string }
  | undefined {
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1];
  if (front === undefined) return undefined;
  const field = (name: string) => {
    const match = new RegExp(`^${name}:[ \\t]*(.*?)[ \\t]*$`, "m").exec(front);
    return match?.[1]?.replace(/^(["'])(.*)\1$/, "$2");
  };
  const locale = field("locale");
  const slug = field("slug");
  const translationKey = field("translationKey");
  const template = field("template");
  if (
    locale === undefined ||
    slug === undefined ||
    translationKey === undefined ||
    template === undefined
  ) {
    return undefined;
  }
  return { locale, slug, translationKey, template };
}

/** Plantillas que llevan CTA con WhatsApp y teléfono. */
export const CTA_TEMPLATES: ReadonlySet<string> = new Set([
  "home",
  "pagina",
  "operador",
]);
