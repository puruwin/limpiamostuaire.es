import assert from "node:assert/strict";
import { test } from "node:test";
import { business } from "../data/business.ts";
import { tarifa } from "../data/tarifa.ts";
import { SITE } from "./site.ts";
import {
  buildGraph,
  ids,
  serializeJsonLd,
  type GraphInput,
} from "./structured-data.ts";

// Los nodos del grafo se recorren a mano en las aserciones.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = Record<string, any>;

function graph(input: Partial<GraphInput> = {}): Node[] {
  return buildGraph({
    locale: "es",
    url: `${SITE}/`,
    title: "Limpiamos tu aire",
    breadcrumbs: [],
    withService: true,
    ...input,
  })["@graph"] as Node[];
}

const find = (nodes: Node[], type: string) =>
  nodes.find((node) => node["@type"] === type);

test("marca y operador enlazados, con los datos de business", () => {
  const nodes = graph();
  const org = find(nodes, "Organization")!;
  const tidi = find(nodes, "LocalBusiness")!;
  assert.equal(org.name, business.brand);
  assert.equal(tidi.name, business.operator);
  assert.deepEqual(tidi.parentOrganization, { "@id": org["@id"] });
  assert.equal(tidi.telephone, business.phone.e164);
  assert.equal(tidi.email, business.email);
  assert.deepEqual(
    tidi.areaServed.map((city: Node) => city.name),
    business.areaServed,
  );
  assert.equal(tidi.address.addressLocality, business.locality);
  assert.equal(tidi.address.streetAddress, undefined);
  assert.deepEqual(tidi.sameAs, [business.googleBusinessUrl]);
  const [hours] = tidi.openingHoursSpecification;
  assert.equal(hours.dayOfWeek.length, 5);
  assert.equal(hours.opens, business.hours.opens);
});

test("LocalBusiness con la url de la página del operador, o la home", () => {
  const tidi = (input: Partial<GraphInput>) =>
    find(graph(input), "LocalBusiness")!;
  assert.equal(tidi({}).url, `${SITE}/`);
  assert.equal(tidi({ locale: "en" }).url, `${SITE}/en/`);
  assert.equal(tidi({ operatorUrl: "/benidorm/" }).url, `${SITE}/benidorm/`);
});

test("WebSite y WebPage en el idioma de la página", () => {
  const nodes = graph({ locale: "en", url: `${SITE}/en/` });
  const website = find(nodes, "WebSite")!;
  assert.equal(website["@id"], ids.website("en"));
  assert.equal(website.url, `${SITE}/en/`);
  assert.equal(website.inLanguage, "en");
  assert.equal(find(nodes, "WebPage")!.inLanguage, "en");
});

test("AboutPage sobre la marca y el operador, solo si se pide", () => {
  assert.equal(find(graph(), "AboutPage"), undefined);
  assert.equal(find(graph(), "WebPage")!.about, undefined);
  const nodes = graph({ url: `${SITE}/sobre-nosotros/`, isAbout: true });
  assert.equal(find(nodes, "WebPage"), undefined);
  assert.deepEqual(find(nodes, "AboutPage")!.about, [
    { "@id": ids.organization },
    { "@id": ids.localBusiness },
  ]);
});

test("Service con toda la tarifa e IVA según el cliente", () => {
  const offers = find(graph(), "Service")!.hasOfferCatalog.itemListElement;
  assert.equal(offers.length, tarifa.length);
  assert.equal(offers.length, 8);
  for (const [i, line] of tarifa.entries()) {
    assert.equal(offers[i].price, line.price);
    assert.equal(offers[i].priceCurrency, "EUR");
    assert.equal(
      offers[i].priceSpecification.valueAddedTaxIncluded,
      line.segment === "vivienda",
    );
  }
  assert.equal(offers[0].name, "Limpieza de 1 split en vivienda");
  const en = find(graph({ locale: "en" }), "Service")!;
  assert.equal(
    en.hasOfferCatalog.itemListElement[0].name,
    "Cleaning of 1 split unit at home",
  );
  assert.equal(find(graph({ withService: false }), "Service"), undefined);
});

test("migas solo fuera de la home, con URLs absolutas", () => {
  assert.equal(find(graph(), "BreadcrumbList"), undefined);
  const url = `${SITE}/precios/`;
  const nodes = graph({
    url,
    breadcrumbs: [
      { name: "Inicio", url: "/" },
      { name: "Precios", url: "/precios/" },
    ],
  });
  const list = find(nodes, "BreadcrumbList")!;
  assert.deepEqual(
    list.itemListElement.map((item: Node) => [item.position, item.item]),
    [
      [1, `${SITE}/`],
      [2, url],
    ],
  );
  assert.deepEqual(find(nodes, "WebPage")!.breadcrumb, {
    "@id": list["@id"],
  });
});

test("sin FAQPage", () => {
  assert.doesNotMatch(JSON.stringify(graph()), /FAQPage/);
});

test("el JSON no puede cerrar el <script>", () => {
  const json = serializeJsonLd({ name: "</script><script>alert(1)" });
  assert.doesNotMatch(json, /</);
  assert.deepEqual(JSON.parse(json), {
    name: "</script><script>alert(1)",
  });
});
