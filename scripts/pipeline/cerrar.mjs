// Aplica el resultado de una issue y encadena la siguiente.
// ok → commit, push, PR contra staging, fusión, issue cerrada con «en-staging».
// bloqueada / necesita-david → etiqueta y comentario con el motivo.
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { config, gh, comment, nightOf } from './lib.mjs';

const cfg = config();
const { ISSUE, CODE, TITLE, LOG, RUN_URL, GITHUB_REPOSITORY: REPO, GH_TOKEN, COUNT } = process.env;
const read = (f) => (existsSync(f) ? readFileSync(f, 'utf8').trim() : '');
const result = read('.noche/resultado') || 'bloqueada';
const sh = (c) => execSync(c, { stdio: 'inherit' });
const tail = (s, n = 60) => s.split('\n').slice(-n).join('\n');

let line;
let stop = false;
if (result === 'limite') {
  await comment(LOG, `⏸️ #${ISSUE} ${TITLE}: Claude ha llegado al límite de uso de la suscripción. Se para la noche; la issue sigue en la cola.`);
  line = null;
  stop = true;
} else if (result === 'ok') {
  const branch = `noche/${ISSUE}-${CODE.replace('.', '-')}`;
  sh(`git switch -c ${branch}`);
  sh(`git add -A -- . ':!.noche' ':!.lighthouseci'`);
  sh(`git -c user.name="github-actions[bot]" -c user.email="41898282+github-actions[bot]@users.noreply.github.com" commit -q -m ${JSON.stringify(`${TITLE} (#${ISSUE})\n\nHecha por la pipeline nocturna: ${RUN_URL}`)}`);
  sh(`git push -q https://x-access-token:${GH_TOKEN}@github.com/${REPO}.git HEAD:refs/heads/${branch}`);
  const body = `Issue #${ISSUE}. Hecha de noche por Claude y fusionada en \`${cfg.baseBranch}\` porque pasó el gate.\n\n${read('.noche/RESUMEN.md') || '_Claude no dejó resumen._'}\n\n---\nEjecución: ${RUN_URL}`;
  const pr = await gh('{repo}/pulls', { method: 'POST', body: { title: TITLE, head: branch, base: cfg.baseBranch, body } });
  await gh(`{repo}/pulls/${pr.number}/merge`, { method: 'PUT', body: { merge_method: 'squash' } });
  await gh(`{repo}/git/refs/heads/${branch}`, { method: 'DELETE' }).catch(() => {});
  await gh(`{repo}/issues/${ISSUE}/labels`, { method: 'POST', body: { labels: ['en-staging'] } });
  await gh(`{repo}/issues/${ISSUE}`, { method: 'PATCH', body: { state: 'closed', state_reason: 'completed' } });
  await comment(ISSUE, `Fusionada en \`${cfg.baseBranch}\` en #${pr.number}. Llega a producción cuando apruebes \`${cfg.baseBranch}\` → \`main\`. Si no te convence en la preview, reabre la issue y quita \`en-staging\`.`);
  line = `✅ #${ISSUE} ${TITLE} → #${pr.number}`;
} else if (result === 'necesita-david') {
  const why = read('.noche/BLOQUEADA');
  await gh(`{repo}/issues/${ISSUE}/labels`, { method: 'POST', body: { labels: ['auto:necesita-david'] } });
  await comment(ISSUE, `La pipeline nocturna no ha podido hacerla sin ti:\n\n${why}\n\nCuando lo resuelvas, quita la etiqueta \`auto:necesita-david\` y vuelve a la cola.`);
  line = `🙋 #${ISSUE} ${TITLE}: necesita a David`;
} else {
  const gate = read('.noche/gate.log');
  await gh(`{repo}/issues/${ISSUE}/labels`, { method: 'POST', body: { labels: ['auto:bloqueada'] } });
  await comment(ISSUE, `El gate falló ${cfg.attempts} veces. No se ha fusionado nada.\n\n<details><summary>Final del registro</summary>\n\n\`\`\`\n${tail(gate)}\n\`\`\`\n</details>\n\nEjecución: ${RUN_URL}\nPara reintentar, quita la etiqueta \`auto:bloqueada\`.`);
  line = `❌ #${ISSUE} ${TITLE}: bloqueada (${tail(gate, 1)})`;
}
if (line) await comment(LOG, line);

// Encadenar: otra ejecución con staging ya actualizado, mientras dure la noche.
const n = Number(COUNT || 1);
const hour = new Date().getUTCHours();
const nightActive = hour >= 20 || hour < cfg.nightEndsUtcHour;
if (stop) {
  console.log('Límite de uso: no se encadena.');
} else if (n < cfg.maxIssuesPerNight && nightActive && !process.env.NO_CHAIN) {
  await gh(`{repo}/actions/workflows/noche.yml/dispatches`, {
    method: 'POST',
    body: { ref: process.env.DEFAULT_BRANCH, inputs: { count: String(n + 1), night: nightOf() } },
  });
  console.log(`Encadenada la ejecución ${n + 1}`);
} else {
  await comment(LOG, `🌅 Fin de la noche tras ${n} issue(s)${nightActive ? ` (límite de ${cfg.maxIssuesPerNight})` : ' (fuera de horario)'}.`);
}
