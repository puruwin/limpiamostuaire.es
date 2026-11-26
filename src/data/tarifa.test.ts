import assert from "node:assert/strict";
import { test } from "node:test";
import {
  desde,
  fechaMadrid,
  lanzamiento,
  lanzamientoVigente,
  presupuesto,
  type Segment,
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

test("presupuesto: la tarifa de 1, 2 y 3 splits tal cual", () => {
  assert.equal(presupuesto({ segment: "vivienda", splits: 1 }).total, 85);
  assert.equal(presupuesto({ segment: "vivienda", splits: 2 }).total, 150);
  assert.equal(presupuesto({ segment: "vivienda", splits: 3 }).total, 210);
  assert.equal(presupuesto({ segment: "negocio", splits: 3 }).total, 260);
  assert.equal(
    presupuesto({ segment: "negocio", splits: 1 }).vatIncluded,
    false,
  );
});

test("presupuesto: el adicional a partir del cuarto split", () => {
  const p = presupuesto({ segment: "negocio", splits: 5 });
  assert.deepEqual(p.lineas, [
    { concepto: "splits", cantidad: 3, importe: 260 },
    { concepto: "adicionales", cantidad: 2, importe: 110 },
  ]);
  assert.equal(p.total, 370);
});

test("presupuesto: exterior por unidad y fuera de zona por visita", () => {
  const casa = presupuesto({
    segment: "vivienda",
    splits: 3,
    exteriores: 2,
    fueraDeZona: true,
  });
  assert.deepEqual(casa.lineas.slice(1), [
    { concepto: "exteriores", cantidad: 2, importe: 40 },
    { concepto: "fueraDeZona", cantidad: 1, importe: 18 },
  ]);
  assert.equal(casa.total, 268);
  assert.equal(
    presupuesto({ segment: "negocio", splits: 1, fueraDeZona: true }).total,
    125,
  );
});

test("presupuesto: lanzamiento, el primero a su precio y los demás al adicional", () => {
  assert.equal(
    presupuesto({ segment: "vivienda", splits: 1, conLanzamiento: true }).total,
    59,
  );
  const p = presupuesto({
    segment: "vivienda",
    splits: 3,
    conLanzamiento: true,
  });
  assert.deepEqual(p.lineas, [
    { concepto: "lanzamiento", cantidad: 1, importe: 59 },
    { concepto: "adicionales", cantidad: 2, importe: 110 },
  ]);
  // Con lanzamiento nunca sale más caro que con la tarifa normal.
  for (let splits = 1; splits <= 8; splits++) {
    assert.ok(
      presupuesto({ segment: "vivienda", splits, conLanzamiento: true }).total <
        presupuesto({ segment: "vivienda", splits }).total,
    );
  }
});

test("presupuesto: rechaza encargos imposibles", () => {
  const segment: Segment = "vivienda";
  assert.throws(() => presupuesto({ segment, splits: 0 }));
  assert.throws(() => presupuesto({ segment, splits: 1.5 }));
  assert.throws(() => presupuesto({ segment, splits: 1, exteriores: 2 }));
  assert.throws(() =>
    presupuesto({ segment: "negocio", splits: 1, conLanzamiento: true }),
  );
});
