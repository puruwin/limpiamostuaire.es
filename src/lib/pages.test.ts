import assert from "node:assert/strict";
import { test } from "node:test";
import {
  alternateLinks,
  languageLinks,
  pagePath,
  pageUrlByKey,
  routeParam,
  validatePages,
  type PageEntry,
} from "./pages.ts";

function page(id: string, data: Partial<PageEntry["data"]> = {}): PageEntry {
  const locale = data.locale ?? (id.startsWith("en/") ? "en" : "es");
  return {
    id,
    data: {
      locale,
      translationKey: id,
      slug: id.split("/")[1] ?? "",
      draft: false,
      ...data,
    },
  };
}

test("rutas con barra final y prefijo de idioma", () => {
  assert.equal(pagePath("es", ""), "/");
  assert.equal(pagePath("en", ""), "/en/");
  assert.equal(pagePath("es", "precios"), "/precios/");
  assert.equal(pagePath("en", "zones/benidorm"), "/en/zones/benidorm/");
  assert.equal(routeParam("es", ""), undefined);
  assert.equal(routeParam("en", ""), "en");
  assert.equal(routeParam("en", "prices"), "en/prices");
});

test("una colección correcta no da errores", () => {
  const pages = [
    page("es/inicio", { slug: "", translationKey: "inicio" }),
    page("en/home", { slug: "", translationKey: "inicio" }),
    page("es/precios", { translationKey: "precios" }),
  ];
  assert.deepEqual(validatePages(pages, { production: true }), []);
});

test("ruta repetida en el mismo idioma", () => {
  const errors = validatePages(
    [page("es/a", { slug: "x" }), page("es/b", { slug: "x" })],
    { production: false },
  );
  assert.equal(errors.length, 1);
  assert.match(errors[0]!, /\/x\/ ya la usa es\/a/);
});

test("translationKey repetida en el mismo idioma", () => {
  const errors = validatePages(
    [
      page("es/a", { translationKey: "k" }),
      page("es/b", { translationKey: "k" }),
    ],
    { production: false },
  );
  assert.equal(errors.length, 1);
  assert.match(errors[0]!, /translationKey "k"/);
});

test("locale distinto de la carpeta", () => {
  const errors = validatePages([page("es/a", { locale: "en" })], {
    production: false,
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0]!, /carpeta "es\/"/);
});

test("borradores: solo bloquean en producción", () => {
  const pages = [page("es/a", { draft: true })];
  assert.deepEqual(validatePages(pages, { production: false }), []);
  assert.match(validatePages(pages, { production: true })[0]!, /draft: true/);
});

test("URL de una página por translationKey", () => {
  const pages = [
    page("es/precios", { translationKey: "precios" }),
    page("en/prices", { translationKey: "precios" }),
  ];
  assert.equal(pageUrlByKey(pages, "es", "precios"), "/precios/");
  assert.equal(pageUrlByKey(pages, "en", "precios"), "/en/prices/");
  assert.equal(pageUrlByKey(pages, "es", "benidorm"), undefined);
});

test("el selector lleva a la equivalente o a la home del idioma", () => {
  const pages = [
    page("es/inicio", { slug: "", translationKey: "inicio" }),
    page("en/home", { slug: "", translationKey: "inicio" }),
    page("es/precios", { translationKey: "precios" }),
    page("en/prices", { translationKey: "precios" }),
    page("es/benidorm", { translationKey: "benidorm" }),
  ];
  assert.deepEqual(languageLinks(pages, "es", "precios"), [
    { locale: "es", url: "/precios/", current: true },
    { locale: "en", url: "/en/prices/", current: false },
  ]);
  assert.deepEqual(languageLinks(pages, "es", "benidorm"), [
    { locale: "es", url: "/benidorm/", current: true },
    { locale: "en", url: "/en/", current: false },
  ]);
  assert.deepEqual(languageLinks(pages, "en"), [
    { locale: "es", url: "/", current: false },
    { locale: "en", url: "/en/", current: true },
  ]);
});

test("hreflang: solo las equivalentes reales y x-default a la española", () => {
  const pages = [
    page("es/precios", { translationKey: "precios" }),
    page("en/prices", { translationKey: "precios" }),
    page("es/benidorm", { translationKey: "benidorm" }),
    page("en/only", { translationKey: "only" }),
  ];
  assert.deepEqual(alternateLinks(pages, "precios"), [
    { hreflang: "es", url: "/precios/" },
    { hreflang: "en", url: "/en/prices/" },
    { hreflang: "x-default", url: "/precios/" },
  ]);
  assert.deepEqual(alternateLinks(pages, "benidorm"), [
    { hreflang: "es", url: "/benidorm/" },
    { hreflang: "x-default", url: "/benidorm/" },
  ]);
  // Sin versión española no hay x-default.
  assert.deepEqual(alternateLinks(pages, "only"), [
    { hreflang: "en", url: "/en/only/" },
  ]);
});
