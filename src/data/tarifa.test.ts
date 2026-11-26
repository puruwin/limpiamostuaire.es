import assert from "node:assert/strict";
import { test } from "node:test";
import {
  desde,
  fechaMadrid,
  lanzamiento,
  lanzamientoVigente,
} from "./tarifa.ts";

test("desde: el precio de 1 split de cada segmento", () => {
  assert.equal(desde("vivienda").price, 85);
  assert.equal(desde("vivienda").vatIncluded, true);
  assert.equal(desde("negocio").price, 110);
  assert.equal(desde("negocio").vatIncluded, false);
});

test("lanzamiento: más barato que la tarifa de 1 split en casa", () => {
  assert.ok(lanzamiento.price < desde("vivienda").price);
});

test("lanzamientoVigente: hasta el último día incluido, hora de Madrid", () => {
  // 23/12 a las 23:30 en Madrid (22:30 UTC): vigente.
  assert.equal(lanzamientoVigente(new Date("2026-12-23T22:30:00Z")), true);
  // 24/12 a las 00:30 en Madrid (23:30 UTC del 23): ya no.
  assert.equal(fechaMadrid(new Date("2026-12-23T23:30:00Z")), "2026-12-24");
  assert.equal(lanzamientoVigente(new Date("2026-12-23T23:30:00Z")), false);
  assert.equal(lanzamientoVigente(new Date("2026-11-26T10:00:00Z")), true);
});
