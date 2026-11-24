// Resumen de la mañana: junta el registro de la noche, lo deja en la issue,
// la asigna a David (así le llega el aviso a una hora normal) y lanza el
// despliegue de staging si existe.
import { gh, nightLog, nightOf, config } from './lib.mjs';

const cfg = config();
const night = nightOf(new Date(Date.now() - 2 * 3600 * 1000));
const log = await nightLog(night, { create: false });
if (!log) {
  console.log(`No hubo noche ${night}.`);
  process.exit(0);
}
const comments = await gh(`{repo}/issues/${log.number}/comments?per_page=100`);
const lines = comments.map((c) => c.body.split('\n')[0]);
const done = lines.filter((l) => l.startsWith('✅'));
const blocked = lines.filter((l) => l.startsWith('❌') || l.startsWith('🙋'));
const other = lines.filter((l) => l.startsWith('⛔') || l.startsWith('🌙') || l.startsWith('⏸️'));

const body = [
  `## Resumen de la noche ${night}`,
  '',
  `**Hechas y fusionadas en \`${cfg.baseBranch}\` (${done.length}):**`,
  ...(done.length ? done.map((l) => `- ${l.slice(2)}`) : ['- Ninguna']),
  '',
  `**Necesitan algo (${blocked.length}):**`,
  ...(blocked.length ? blocked.map((l) => `- ${l}`) : ['- Nada']),
  ...(other.length ? ['', ...other] : []),
  '',
  process.env.STAGING_URL ? `Preview: ${process.env.STAGING_URL}` : 'Preview: todavía no hay staging desplegado (M1.2).',
  '',
  `Cuando la preview esté bien, abre o aprueba el PR \`${cfg.baseBranch}\` → \`main\`.`,
].join('\n');

await gh(`{repo}/issues/${log.number}`, { method: 'PATCH', body: { body, assignees: [cfg.owner] } });

// Los push de GITHUB_TOKEN no disparan workflows: el despliegue de staging se lanza a mano.
for (const wf of ['deploy.yml', 'ci.yml']) {
  try {
    await gh(`{repo}/actions/workflows/${wf}/dispatches`, { method: 'POST', body: { ref: cfg.baseBranch } });
    console.log(`Lanzado ${wf} en ${cfg.baseBranch}`);
    break;
  } catch (e) {
    console.log(`${wf}: ${e.message.split('\n')[0]}`);
  }
}
