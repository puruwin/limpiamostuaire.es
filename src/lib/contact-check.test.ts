import assert from "node:assert/strict";
import { test } from "node:test";
import {
  whatsappGreeting,
  whatsappHref,
  whatsappTopic,
} from "../data/business.ts";
import {
  checkContact,
  frontmatterPage,
  type ContactPage,
} from "./contact-check.ts";

const tel = "tel:+34608962213";
const casa = whatsappHref("es", "inicio");
const negocio = whatsappHref("es", "negocios");

interface Options {
  header?: string[];
  floating?: string[];
  cta?: string[];
  other?: string[];
}

const a = (href: string, spot?: string) =>
  `<a href="${href.replace(/&/g, "&amp;")}"${spot ? ` data-contacto="${spot}"` : ""}>x</a>`;

/** Página como la de BaseLayout: cabecera, main con las CTA y flotante. */
function html(wa: string, options: Options = {}): string {
  const {
    header = [a(tel, "cabecera"), a(wa, "cabecera")],
    floating = [a(wa, "flotante")],
    cta = [a(wa, "cta"), a(tel, "cta")],
    other = [],
  } = options;
  return `<html><body><header>${header.join("")}</header><main>${cta.join("")}${other.join("")}</main><footer>${a(tel)}</footer>${floating.join("")}</body></html>`;
}

const collection = new Map<string, ContactPage>([
  ["/", { translationKey: "inicio", cta: true }],
  ["/negocios/", { translationKey: "negocios", cta: true }],
  ["/aviso-legal/", { translationKey: "aviso-legal", cta: false }],
]);

const check = (file: string, page: string) =>
  checkContact([{ file, html: page }], collection);

test("saludo de WhatsApp por página: negocio, conductos y casa por defecto", () => {
  assert.equal(whatsappTopic("negocios"), "negocio");
  assert.equal(whatsappTopic("apartamentos-turisticos"), "apartamento");
  assert.equal(whatsappTopic("conductos"), "conductos");
  assert.equal(whatsappTopic("precios"), "casa");
  assert.equal(whatsappTopic(undefined), "casa");
  assert.notEqual(
    whatsappGreeting("es", "negocios"),
    whatsappGreeting("es", "inicio"),
  );
  assert.notEqual(
    whatsappGreeting("en", "negocios"),
    whatsappGreeting("es", "negocios"),
  );
});

test("enlace de WhatsApp con el número y el saludo codificado", () => {
  const url = new URL(negocio);
  assert.equal(url.origin + url.pathname, "https://wa.me/34608962213");
  assert.equal(
    url.searchParams.get("text"),
    whatsappGreeting("es", "negocios"),
  );
});

test("página correcta, sin errores", () => {
  assert.deepEqual(check("index.html", html(casa)), []);
  assert.deepEqual(check("negocios/index.html", html(negocio)), []);
  assert.deepEqual(
    check("aviso-legal/index.html", html(casa, { cta: [] })),
    [],
  );
});

test("la 404 usa el saludo de casa en su idioma y no necesita CTA", () => {
  const en = whatsappHref("en");
  assert.deepEqual(check("404.html", html(casa, { cta: [] })), []);
  assert.deepEqual(check("en/404.html", html(en, { cta: [] })), []);
  assert.match(check("en/404.html", html(casa, { cta: [] }))[0]!, /texto/);
});

test("el texto de WhatsApp tiene que ser el de la página", () => {
  const errors = check("negocios/index.html", html(casa));
  assert.equal(errors.length, 3);
  assert.match(errors[0]!, /^negocios\/index\.html: WhatsApp con el texto/);
});

test("un solo enlace con otro texto también falla", () => {
  const errors = check(
    "negocios/index.html",
    html(negocio, { floating: [a(casa, "flotante")] }),
  );
  assert.equal(errors.length, 1);
});

test("número, formato y texto de WhatsApp", () => {
  const bad = [
    "https://wa.me/34600000000?text=Hola",
    "https://api.whatsapp.com/send?phone=34608962213",
    "http://wa.me/34608962213?text=Hola",
    "https://wa.me/34608962213",
  ];
  for (const href of bad) {
    const errors = check(
      "aviso-legal/index.html",
      html(casa, { cta: [], other: [a(href)] }),
    );
    assert.equal(errors.length, 1, href);
  }
});

test("todos los tel: son el teléfono del negocio", () => {
  const errors = check(
    "index.html",
    html(casa, { other: [a("tel:+34600000000")] }),
  );
  assert.deepEqual(errors, [
    "index.html: tel:+34600000000 no es tel:+34608962213.",
  ]);
});

test("cabecera con teléfono y WhatsApp", () => {
  assert.deepEqual(
    check("index.html", html(casa, { header: [a(tel, "cabecera")] })),
    ["index.html: sin WhatsApp en la cabecera."],
  );
  assert.deepEqual(
    check("index.html", html(casa, { header: [a(casa, "cabecera")] })),
    ["index.html: sin teléfono en la cabecera."],
  );
});

test("data-contacto=cabecera solo dentro de <header>, y al revés", () => {
  assert.match(
    check("index.html", html(casa, { other: [a(tel, "cabecera")] }))[0]!,
    /fuera de la cabecera/,
  );
  assert.match(
    check(
      "index.html",
      html(casa, { header: [a(tel, "cabecera"), a(casa, "cabecera"), a(tel)] }),
    )[0]!,
    /en la cabecera sin data-contacto/,
  );
});

test("un botón flotante de WhatsApp, ni cero ni dos", () => {
  assert.match(
    check("index.html", html(casa, { floating: [] }))[0]!,
    /0 botones/,
  );
  assert.match(
    check(
      "index.html",
      html(casa, { floating: [a(casa, "flotante"), a(casa, "flotante")] }),
    )[0]!,
    /2 botones/,
  );
});

test("CTA obligatoria en las plantillas con CTA, con los dos botones", () => {
  assert.deepEqual(check("index.html", html(casa, { cta: [] })), [
    "index.html: sin CTA de WhatsApp.",
  ]);
  assert.match(
    check("index.html", html(casa, { cta: [a(casa, "cta")] }))[0]!,
    /1 WhatsApp y 0 teléfonos/,
  );
});

test("data-contacto desconocido", () => {
  assert.match(
    check("index.html", html(casa, { other: [a(tel, "pie")] }))[0]!,
    /data-contacto="pie" desconocido/,
  );
});

test("frontmatter: locale, slug, translationKey y template", () => {
  const source = `---
locale: es
translationKey: inicio
slug: ""
title: "Inicio: algo"
template: home
updated: 2026-11-26
---

Texto.`;
  assert.deepEqual(frontmatterPage(source), {
    locale: "es",
    slug: "",
    translationKey: "inicio",
    template: "home",
  });
  assert.equal(frontmatterPage("---\nlocale: es\n---\n"), undefined);
  assert.equal(frontmatterPage("Sin frontmatter"), undefined);
});
