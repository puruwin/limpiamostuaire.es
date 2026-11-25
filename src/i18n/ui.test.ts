import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLocale, localePrefix, locales } from "./locales.ts";
import { ui } from "./ui.ts";

test("todos los idiomas tienen las mismas claves que es", () => {
  const keys = Object.keys(ui[defaultLocale]).sort();
  for (const locale of locales) {
    assert.deepEqual(Object.keys(ui[locale]).sort(), keys, locale);
  }
});

test("ninguna cadena está vacía", () => {
  for (const locale of locales) {
    for (const [key, value] of Object.entries(ui[locale])) {
      assert.ok(value.trim(), `${locale}: ${key}`);
    }
  }
});

test("es va en la raíz y en en /en", () => {
  assert.equal(localePrefix("es"), "");
  assert.equal(localePrefix("en"), "/en");
});
