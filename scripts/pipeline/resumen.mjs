// Resumen de la mañana: junta el registro de las últimas 24 h, lo deja en la issue,
// la asigna a David (así le llega el aviso a una hora normal). Staging ya se
// despliega tras cada fusión (cerrar.mjs).
import { gh, dayLog, dayOf, config } from "./lib.mjs";

const cfg = config();
const night = dayOf(new Date(Date.now() - 2 * 3600 * 1000));
const log = await dayLog(night, { create: false });
if (!log) {
  console.log(`Sin registro ${night}.`);
  process.exit(0);
}
const comments = await gh(`{repo}/issues/${log.number}/comments?per_page=100`);
const lines = comments.map((c) => c.body.split("\n")[0]);
const done = lines.filter((l) => l.startsWith("✅"));
const blocked = lines.filter((l) => l.startsWith("❌") || l.startsWith("🙋"));
const other = lines.filter(
  (l) =>
    l.startsWith("⛔") ||
    l.startsWith("🌙") ||
    l.startsWith("⏸️") ||
    l.startsWith("🛑") ||
    l.startsWith("🌅"),
);

const body = [
  `## Resumen ${night} (hasta las 7:00)`,
  "",
  `**Hechas y fusionadas en \`${cfg.baseBranch}\` (${done.length}):**`,
  ...(done.length ? done.map((l) => `- ${l.slice(2)}`) : ["- Ninguna"]),
  "",
  `**Necesitan algo (${blocked.length}):**`,
  ...(blocked.length ? blocked.map((l) => `- ${l}`) : ["- Nada"]),
  ...(other.length ? ["", ...other] : []),
  "",
  `Preview: ${process.env.STAGING_URL || "https://staging.limpiamostuaire.es/"}`,
  "",
  `Cuando la preview esté bien, abre o aprueba el PR \`${cfg.baseBranch}\` → \`main\`.`,
].join("\n");

await gh(`{repo}/issues/${log.number}`, {
  method: "PATCH",
  body: { body, assignees: [cfg.owner] },
});
