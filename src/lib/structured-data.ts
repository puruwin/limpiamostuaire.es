import { business } from "../data/business.ts";
import { tarifa } from "../data/tarifa.ts";
import { localePrefix, type Locale } from "../i18n/locales.ts";
import { useTranslations } from "../i18n/ui.ts";
import { SITE } from "./site.ts";

// Datos estructurados (JSON-LD) de cada página: un solo @graph con la web, la
// página, la marca (Organization «Limpiamos tu aire»), el operador
// (LocalBusiness «Ti&Di», con parentOrganization) y, donde toca, el servicio
// con la tarifa y las migas. Seo.astro lo pinta y check:seo lo comprueba.
// Sin FAQPage: Google retiró ese resultado enriquecido.

/** Páginas que llevan el Service con la tarifa. */
export const serviceKeys: readonly string[] = ["inicio", "precios"];

export interface GraphInput {
  locale: Locale;
  /** URL absoluta de la página (la canonical). */
  url: string;
  title: string;
  /** Migas con rutas relativas ("/", "/precios/"); vacío en la home. */
  breadcrumbs: readonly { name: string; url: string }[];
  withService: boolean;
}

type Node = Record<string, unknown>;

const absolute = (path: string) => new URL(path, SITE).href;

/** @id de los nodos que se repiten en todas las páginas. */
export const ids = {
  organization: `${SITE}/#organization`,
  localBusiness: `${SITE}/#tidi`,
  website: (locale: Locale) => `${SITE}${localePrefix(locale)}/#website`,
  service: (locale: Locale) => `${SITE}${localePrefix(locale)}/#servicio`,
};

export function buildGraph({
  locale,
  url,
  title,
  breadcrumbs,
  withService,
}: GraphInput): { "@context": string; "@graph": Node[] } {
  const t = useTranslations(locale);
  const home = absolute(`${localePrefix(locale)}/`);
  const areaServed = business.areaServed.map((name) => ({
    "@type": "City",
    name,
  }));
  const withCrumbs = breadcrumbs.length >= 2;

  const graph: Node[] = [
    {
      "@type": "WebSite",
      "@id": ids.website(locale),
      url: home,
      name: business.brand,
      inLanguage: locale,
      publisher: { "@id": ids.organization },
    },
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: title,
      inLanguage: locale,
      isPartOf: { "@id": ids.website(locale) },
      ...(withCrumbs && { breadcrumb: { "@id": `${url}#breadcrumb` } }),
    },
    {
      "@type": "Organization",
      "@id": ids.organization,
      name: business.brand,
      url: absolute("/"),
      logo: {
        "@type": "ImageObject",
        url: absolute("/logo.png"),
        width: 512,
        height: 512,
      },
      email: business.email,
      telephone: business.phone.e164,
    },
    {
      "@type": "LocalBusiness",
      "@id": ids.localBusiness,
      name: business.operator,
      parentOrganization: { "@id": ids.organization },
      url: home,
      image: absolute("/og.png"),
      telephone: business.phone.e164,
      email: business.email,
      // Negocio de área de servicio con la dirección oculta: solo localidad.
      address: {
        "@type": "PostalAddress",
        addressLocality: business.locality,
        addressRegion: business.region,
        addressCountry: business.country,
      },
      areaServed,
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: business.hours.days.map(
            (day) => `https://schema.org/${day}`,
          ),
          opens: business.hours.opens,
          closes: business.hours.closes,
        },
      ],
      paymentAccepted: t("schema.paymentAccepted"),
      sameAs: [business.googleBusinessUrl],
    },
  ];

  if (withService) {
    graph.push({
      "@type": "Service",
      "@id": ids.service(locale),
      name: t("schema.serviceType"),
      serviceType: t("schema.serviceType"),
      provider: { "@id": ids.localBusiness },
      areaServed,
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: t("schema.offerCatalog"),
        itemListElement: tarifa.map((line) => ({
          "@type": "Offer",
          name: line.name[locale],
          price: line.price,
          priceCurrency: "EUR",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: line.price,
            priceCurrency: "EUR",
            valueAddedTaxIncluded: line.vatIncluded,
          },
        })),
      },
    });
  }

  if (withCrumbs) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: breadcrumbs.map((crumb, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: crumb.name,
        item: absolute(crumb.url),
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

/** JSON para un <script type="application/ld+json">, sin "</script>" posible. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
