import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { locales, type Locale } from "../src/i18n/locales.ts";
import { ui, type UiKey } from "../src/i18n/ui.ts";
import type { Config } from "./config.ts";
import { ackEmail, escapeHtml, quoteEmail, type Email } from "./mail.ts";
import type { Quote } from "./validate.ts";

// Idioma de los emails: el acuse, entero en el idioma del cliente; el email a
// hola@, en español aunque el cliente escriba en otro idioma.

const config: Config = {
  port: 0,
  publicUrl: "https://limpiamostuaire.es",
  photoDir: "/tmp/no-se-usa",
  signingSecret: "secreto",
  turnstileSecret: "secreto",
  resendApiKey: "",
  mailFrom: "Limpiamos tu aire <formulario@example.com>",
  mailTo: ["hola@example.com"],
  subjectPrefix: "",
};

// Todos los campos, para que salgan todas las etiquetas. Los valores del
// cliente no son de ningún idioma.
const quote = (locale: Locale): Quote & { email: string } => ({
  name: "Ana",
  phone: "+44 7700 900123",
  email: "ana@example.com",
  municipality: "Benidorm",
  municipalityIsOther: false,
  place: "negocio",
  splits: 4,
  ducts: "si",
  outdoor: "no",
  message: "OK",
  locale,
  origin: "/en/contact/",
});

// Por debajo, cadenas como «Email» o «WhatsApp» son iguales en los dos idiomas.
const MIN_LENGTH = 16;

/** Fragmentos de cadenas de `other` que no son iguales en `locale`. */
function foreign(locale: Locale, other: Locale): [UiKey, string][] {
  return (Object.keys(ui[other]) as UiKey[])
    .filter((key) => ui[other][key] !== ui[locale][key])
    .flatMap((key) =>
      ui[other][key]
        .split(/\{\w+\}/)
        .map((part) => part.trim())
        .filter((part) => part.length >= MIN_LENGTH)
        .map((part): [UiKey, string] => [key, part]),
    );
}

function assertOnly(email: Email, locale: Locale) {
  for (const other of locales.filter((l) => l !== locale)) {
    for (const [key, fragment] of foreign(locale, other)) {
      const where = `${key} en "${other}": «${fragment}»`;
      assert.ok(!email.subject.includes(fragment), `asunto con ${where}`);
      assert.ok(!email.text.includes(fragment), `texto con ${where}`);
      assert.ok(
        !email.html.includes(escapeHtml(fragment)),
        `HTML con ${where}`,
      );
    }
  }
}

describe("idioma de los emails", () => {
  for (const locale of locales) {
    test(`acuse en "${locale}": solo cadenas de su idioma`, () => {
      const email = ackEmail(quote(locale), 2, config);
      assertOnly(email, locale);

      const t = ui[locale];
      assert.equal(email.subject, t["email.ack.subject"]);
      for (const key of [
        "email.ack.text",
        "email.ack.copy",
        "form.name",
        "form.municipality",
        "form.place",
        "form.place.negocio",
        "form.splits",
        "form.ducts",
        "form.outdoor",
        "form.yes",
        "form.no",
        "form.message",
        "form.photos",
        "footer.hours",
      ] as const) {
        assert.ok(email.text.includes(t[key]), `falta ${key}: «${t[key]}»`);
      }
    });
  }

  test("email a hola@ en español aunque el cliente escriba en inglés", () => {
    const email = quoteEmail(
      quote("en"),
      ["https://limpiamostuaire.es/api/presupuesto/fotos/1"],
      config,
    );
    assertOnly(email, "es");
    assert.ok(email.text.includes(`Idioma: ${ui.es["lang.en"]}`));
    assert.ok(email.text.includes(ui.es["form.place.negocio"]));
    assert.equal(email.subject, "Presupuesto · Benidorm · 4 splits");
  });
});

describe("asunto del email a hola@", () => {
  test("un split, en singular; el prefijo de staging delante", () => {
    const email = quoteEmail(
      { ...quote("es"), municipality: "Altea", splits: 1 },
      [],
      { ...config, subjectPrefix: "[staging] " },
    );
    assert.equal(email.subject, "[staging] Presupuesto · Altea · 1 split");
  });

  test("municipio «Otro»: el que escribió el cliente, marcado en el cuerpo", () => {
    const email = quoteEmail(
      { ...quote("es"), municipality: "Benissa", municipalityIsOther: true },
      [],
      config,
    );
    assert.equal(email.subject, "Presupuesto · Benissa · 4 splits");
    assert.ok(email.text.includes("Benissa (otro, escrito por el cliente)"));
  });

  test("sin conductos ni exterior contestados, sin esas filas", () => {
    const email = quoteEmail(
      { ...quote("es"), ducts: undefined, outdoor: undefined },
      [],
      config,
    );
    assert.ok(!email.text.includes(ui.es["form.ducts"]));
    assert.ok(!email.text.includes(ui.es["form.outdoor"]));
    assert.ok(email.text.includes("Sin fotos."));
  });
});
