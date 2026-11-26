import assert from "node:assert/strict";
import { test } from "node:test";
import { diaYMes, euros, fill, lista } from "./format.ts";

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

test("fill: sustituye y falla si falta un valor", () => {
  assert.equal(fill("{a} y {b}", { a: "1", b: "2" }), "1 y 2");
  assert.throws(() => fill("{a}", {}), /falta \{a\}/);
});
