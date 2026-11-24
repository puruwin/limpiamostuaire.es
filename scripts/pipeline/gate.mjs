// Gate de una issue: rutas protegidas, tests borrados y los comandos de
// pipeline.config.json, en orden. Sale con 1 al primer fallo y deja el
// registro en .noche/gate.log para dárselo a Claude en el segundo intento.
import { execSync, spawnSync } from 'node:child_process';
import { writeFileSync, appendFileSync } from 'node:fs';
import { config, isProtected } from './lib.mjs';

const cfg = config();
const LOG = '.noche/gate.log';
writeFileSync(LOG, '');
const say = (s) => { console.log(s); appendFileSync(LOG, s + '\n'); };

// HEAD = staging + la pipeline de main (commit local del workflow).
const base = process.env.GATE_BASE ?? 'HEAD';
const changes = execSync(`git add -A -- . ':!.noche' ':!.lighthouseci' && git diff --cached --name-status ${base}`, { encoding: 'utf8' })
  .trim().split('\n').filter(Boolean).map((l) => l.split('\t'));
execSync('git reset -q');

const touched = changes.map((c) => c.at(-1)).filter((p) => isProtected(p, cfg.protectedPaths));
if (touched.length) {
  say(`FALLO: has tocado rutas protegidas (el gate no se cambia de noche): ${touched.join(', ')}. Deshaz esos cambios.`);
  process.exit(1);
}
const deletedTests = changes.filter(([s, p]) => s === 'D' && /(\.test\.|\/tests?\/)/.test(p)).map((c) => c[1]);
if (deletedTests.length) {
  say(`FALLO: has borrado tests: ${deletedTests.join(', ')}. No se borran tests para que pase el gate.`);
  process.exit(1);
}
if (changes.length === 0) {
  say('FALLO: no hay cambios respecto a staging.');
  process.exit(1);
}

for (const cmd of cfg.gate) {
  say(`\n$ ${cmd}`);
  const r = spawnSync('bash', ['-o', 'pipefail', '-c', cmd], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  process.stdout.write(out);
  if (r.status !== 0) {
    appendFileSync(LOG, out.split('\n').slice(-120).join('\n') + '\n');
    say(`FALLO: «${cmd}» salió con ${r.status}.`);
    process.exit(1);
  }
  appendFileSync(LOG, 'ok\n');
}
say('\nGate superado.');
