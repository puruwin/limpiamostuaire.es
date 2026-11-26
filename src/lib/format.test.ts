import assert from "node:assert/strict";
import { test } from "node:test";
import { diaYMes, euros, fechaLarga, fill, lista, plural } from "./format.ts";

const NBSP = " ";

test("euros: «85 €» en español y «€85» en inglés", () => {
  assert.equal(euros("es", 85), `85${NBSP}€`);
  assert.equal(euros("en", 85), "€85");
  assert.equal(euros("es", 90.75), `90,75${NBSP}€`);
});

test("lista: con «y» y «and»", () => {
  assert.equal(
    lista("es", ["Benidorm", "Altea", "Calp"]),
    "Benidorm, Altea y Calp",
  );
  assert.equal(
    lista("en", ["Benidorm", "Altea", "Calp"]),
    "Benidorm, Altea and Calp",
  );
});

test("diaYMes: sin desfase de zona horaria", () => {
  assert.equal(diaYMes("es", "2026-12-23"), "23 de diciembre");
  assert.equal(diaYMes("en", "2026-12-23"), "23 December");
});

test("fechaLarga: con año y sin desfase de zona horaria", () => {
  const date = new Date("2026-11-26");
  assert.equal(fechaLarga("es", date), "26 de noviembre de 2026");
  assert.equal(fechaLarga("en", date), "26 November 2026");
});

test("fill: sustituye y falla si falta un valor", () => {
  assert.equal(fill("{a} y {b}", { a: "1", b: "2" }), "1 y 2");
  assert.throws(() => fill("{a}", {}), /falta \{a\}/);
});

test("plural: one con 1 y other con el resto", () => {
  assert.equal(plural("es", 1), "one");
  assert.equal(plural("es", 2), "other");
  assert.equal(plural("en", 1), "one");
  assert.equal(plural("en", 0), "other");
});
