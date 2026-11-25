import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseCode,
  parseDeps,
  depSatisfied,
  eligible,
  isProtected,
  dayOf,
  sumCosts,
  consecutiveFailures,
  changedScripts,
} from "./lib.mjs";

const cfg = {
  owner: "puruwin",
  excludedLabels: ["fuera-de-codigo", "auto:bloqueada"],
  excludedMilestonePrefixes: ["M0"],
  excludedCodes: { "M1.1": "gate" },
};
const issue = (
  number,
  title,
  state,
  deps = "—",
  labels = [],
  user = "puruwin",
) => ({
  number,
  title,
  state,
  labels: labels.map((name) => ({ name })),
  user: { login: user },
  body: `Texto\n\nDepende de: ${deps}.\n\n---\n_pie_`,
});

test("parseCode", () => {
  assert.deepEqual(parseCode("M1.10 · Algo"), {
    code: "M1.10",
    milestone: "M1",
    n: [1, 10],
  });
  assert.equal(parseCode("Noche 2026-11-25"), null);
});

test("parseDeps", () => {
  assert.deepEqual(parseDeps("x\nDepende de: M1.5, M0.3.\n"), ["M1.5", "M0.3"]);
  assert.deepEqual(parseDeps("Depende de: M2, M3, M4."), ["M2", "M3", "M4"]);
  assert.deepEqual(parseDeps("Depende de: —."), []);
  assert.deepEqual(parseDeps("sin línea"), []);
});

test("depSatisfied: issue, milestone y desconocida", () => {
  const all = [
    issue(1, "M2.1 · A", "closed"),
    issue(2, "M2.2 · B", "open"),
    issue(3, "M1.3 · C", "closed"),
  ];
  assert.equal(depSatisfied("M1.3", all), true);
  assert.equal(depSatisfied("M2.1", all), true);
  assert.equal(depSatisfied("M2", all), false);
  assert.equal(depSatisfied("M9.9", all), false);
});

test("eligible: orden, exclusiones y dependencias", () => {
  const all = [
    issue(7, "M1.1 · Astro", "closed"),
    issue(13, "M1.7 · Sitemap", "open", "M1.3"),
    issue(9, "M1.3 · Modelo", "open", "M1.1"),
    issue(11, "M1.10 · Diez", "open", "M1.1"),
    issue(3, "M0.3 · Ficha", "open", "—", ["fuera-de-codigo"]),
    issue(2, "M0.2 · DNS", "open"),
    issue(20, "M2.6 · Benidorm", "open", "M1.1", ["auto:bloqueada"]),
    issue(21, "M2.7 · Otro autor", "open", "—", [], "alguien"),
    { ...issue(30, "M3.1 · PR", "open"), pull_request: {} },
  ];
  const { ok, skipped } = eligible(all, cfg);
  assert.deepEqual(
    ok.map((i) => i.code),
    ["M1.3", "M1.10"],
  );
  const why = Object.fromEntries(skipped.map((s) => [s.code, s.why]));
  assert.match(why["M1.7"], /depende de M1.3/);
  assert.match(why["M0.3"], /etiqueta/);
  assert.match(why["M0.2"], /milestone M0/);
  assert.match(why["M2.6"], /auto:bloqueada/);
  assert.match(why["M2.7"], /autor/);
});

test("isProtected", () => {
  const p = [".github/", "scripts/check-*.mjs", "lighthouserc.json"];
  assert.equal(isProtected(".github/workflows/ci.yml", p), true);
  assert.equal(isProtected("scripts/check-seo.mjs", p), true);
  assert.equal(isProtected("scripts/sub/check-seo.mjs", p), false);
  assert.equal(isProtected("lighthouserc.json", p), true);
  assert.equal(isProtected("src/pages/index.astro", p), false);
});

test("dayOf: el día va de 06:00 a 06:00 UTC", () => {
  assert.equal(dayOf(new Date("2026-11-25T23:00:00Z")), "2026-11-25");
  assert.equal(dayOf(new Date("2026-11-26T04:30:00Z")), "2026-11-25");
  assert.equal(dayOf(new Date("2026-11-26T06:00:00Z")), "2026-11-26");
});

test("consecutiveFailures", () => {
  assert.equal(
    consecutiveFailures(["✅ a", "❌ b", "⏸️ c", "❌ d", "❌ e"]),
    3,
  );
  assert.equal(consecutiveFailures(["❌ a", "🙋 b", "❌ c"]), 1);
  assert.equal(consecutiveFailures(["✅ a"]), 0);
});

test("sumCosts", () => {
  assert.equal(
    sumCosts([
      "✅ #9 M1.3 [coste:1.50]",
      "❌ #13 M1.7 [coste:0.25]",
      "sin marca",
      null,
    ]),
    1.75,
  );
});

test("changedScripts: cambiar o quitar falla, añadir no", () => {
  const before = {
    build: "astro build",
    "check:seo": "node scripts/check-seo.mjs",
  };
  assert.deepEqual(changedScripts(before, { ...before, nuevo: "x" }), []);
  assert.deepEqual(changedScripts(before, { ...before, "check:seo": "true" }), [
    "check:seo",
  ]);
  assert.deepEqual(changedScripts(before, { build: "astro build" }), [
    "check:seo",
  ]);
});
