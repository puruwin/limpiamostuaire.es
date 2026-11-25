import assert from "node:assert/strict";
import { test } from "node:test";
import {
  pagePath,
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
