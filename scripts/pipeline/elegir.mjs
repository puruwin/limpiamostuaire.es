// Comprueba que el gate está completo y elige la siguiente issue.
// Salidas: issue (número o vacío), code, title, log (issue de registro del día).
// Con ISSUE=<n> fuerza esa issue (workflow_dispatch manual), si es elegible.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import {
  config,
  allIssues,
  eligible,
  ensureLabels,
  dayLog,
  commentOnce,
  output,
  weeklyCost,
  lastLogEntry,
} from "./lib.mjs";

const cfg = config();
await ensureLabels();

// Tras un 🛑 el cron no rearranca: hace falta lanzarlo a mano (Run workflow).
if (
  process.env.EVENT === "schedule" &&
  (await lastLogEntry())?.startsWith("🛑")
) {
  console.log("Parado por fallos seguidos; esperando arranque manual.");
  output("issue", "");
  process.exit(0);
}
const log = await dayLog();
output("log", log.number);

const pkg = existsSync("package.json")
  ? JSON.parse(readFileSync("package.json", "utf8"))
  : {};
const missing = cfg.requiredScripts.filter((s) => !pkg.scripts?.[s]);
if (missing.length) {
  await commentOnce(
    log.number,
    `⛔ No arranco: al gate le faltan scripts en \`${cfg.baseBranch}\`: ${missing.map((s) => `\`${s}\``).join(", ")}. Se hacen de día, con revisión (ver docs/desarrollo-autonomo.md).`,
  );
  output("issue", "");
  process.exit(0);
}

if (cfg.weeklyBudgetUsd) {
  const spent = await weeklyCost();
  if (spent >= cfg.weeklyBudgetUsd) {
    await commentOnce(
      log.number,
      `⏸️ Tope semanal: ${spent.toFixed(2)} de ${cfg.weeklyBudgetUsd} USD equivalentes en 7 días. Parado.`,
    );
    output("issue", "");
    process.exit(0);
  }
}

const issues = await allIssues();
const { ok, skipped } = eligible(issues, cfg);
const forced = process.env.ISSUE
  ? ok.find((i) => i.number === Number(process.env.ISSUE))
  : null;
const next = process.env.ISSUE ? forced : ok[0];

if (!next) {
  const why = process.env.ISSUE
    ? `#${process.env.ISSUE} no es elegible: ${skipped.find((s) => s.number === Number(process.env.ISSUE))?.why ?? "cerrada o sin código"}.`
    : "No queda ninguna issue elegible.";
  await commentOnce(
    log.number,
    `🌙 ${why}\n\n<details><summary>Descartadas</summary>\n\n${skipped.map((s) => `- #${s.number} ${s.code}: ${s.why}`).join("\n")}\n</details>`,
  );
  output("issue", "");
  process.exit(0);
}

mkdirSync(".noche", { recursive: true });
writeFileSync(
  ".noche/issue.md",
  `# #${next.number} ${next.title}\n\n${next.body ?? ""}\n`,
);
output("issue", next.number);
output("code", next.code);
output("title", next.title.replace(/[\r\n]/g, " "));
console.log(`Siguiente: #${next.number} ${next.title}`);
