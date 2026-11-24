// Funciones compartidas de la pipeline nocturna. Las puras están exportadas
// para los tests (lib.test.mjs); las de red usan la API REST de GitHub.
import { readFileSync, appendFileSync } from 'node:fs';

export const config = () => JSON.parse(readFileSync('pipeline.config.json', 'utf8'));

// «M1.3 · Modelo de contenido…» → { code: 'M1.3', milestone: 'M1', n: [1, 3] }
export function parseCode(title) {
  const m = /^M(\d+)\.(\d+)\b/.exec(title ?? '');
  if (!m) return null;
  return { code: `M${m[1]}.${m[2]}`, milestone: `M${m[1]}`, n: [Number(m[1]), Number(m[2])] };
}

// «Depende de: M1.5, M0.3.» → ['M1.5', 'M0.3']. Acepta milestones enteros («M2»).
export function parseDeps(body) {
  const m = /^Depende de:\s*(.+)$/m.exec(body ?? '');
  if (!m) return [];
  return [...m[1].matchAll(/M\d+(?:\.\d+)?/g)].map((x) => x[0]);
}

// Una dependencia se cumple si su issue (o todas las de su milestone) está cerrada.
export function depSatisfied(dep, issues) {
  const matches = issues.filter((i) => {
    const c = parseCode(i.title);
    if (!c) return false;
    return dep.includes('.') ? c.code === dep : c.milestone === dep;
  });
  if (matches.length === 0) return false; // dependencia desconocida: no arriesgar
  return matches.every((i) => i.state === 'closed');
}

// Devuelve las issues que se pueden hacer esta noche, en orden, y por qué se
// descarta cada una de las demás.
export function eligible(issues, cfg) {
  const ok = [];
  const skipped = [];
  for (const i of issues) {
    if (i.state !== 'open' || i.pull_request) continue;
    const c = parseCode(i.title);
    if (!c) continue;
    const labels = (i.labels ?? []).map((l) => (typeof l === 'string' ? l : l.name));
    const why = (() => {
      if (i.user?.login !== cfg.owner) return `autor ${i.user?.login} no es ${cfg.owner}`;
      const bad = labels.find((l) => cfg.excludedLabels.includes(l));
      if (bad) return `etiqueta ${bad}`;
      if (cfg.excludedMilestonePrefixes.includes(c.milestone)) return `milestone ${c.milestone}`;
      if (cfg.excludedCodes[c.code]) return cfg.excludedCodes[c.code];
      const pending = parseDeps(i.body).filter((d) => !depSatisfied(d, issues));
      if (pending.length) return `depende de ${pending.join(', ')}`;
      return null;
    })();
    if (why) skipped.push({ number: i.number, code: c.code, why });
    else ok.push({ ...i, code: c.code, n: c.n });
  }
  ok.sort((a, b) => a.n[0] - b.n[0] || a.n[1] - b.n[1]);
  return { ok, skipped };
}

// Patrón simple: «dir/» = prefijo, «*» = cualquier cosa sin «/».
export function isProtected(path, patterns) {
  return patterns.some((p) => {
    if (p.endsWith('/')) return path.startsWith(p);
    const re = new RegExp('^' + p.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*') + '$');
    return re.test(path);
  });
}

// Noche a la que pertenece una fecha: lo que pasa antes de las 12:00 UTC es de la noche anterior.
export function nightOf(date = new Date()) {
  const d = new Date(date.getTime() - 12 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

// ---------- red ----------

const REPO = process.env.GITHUB_REPOSITORY;

export async function gh(path, { method = 'GET', body } = {}) {
  const res = await fetch(`https://api.github.com/${path.replace('{repo}', `repos/${REPO}`)}`, {
    method,
    headers: {
      authorization: `Bearer ${process.env.GH_TOKEN}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

export async function allIssues() {
  const out = [];
  for (let page = 1; ; page++) {
    const batch = await gh(`{repo}/issues?state=all&per_page=100&page=${page}`);
    out.push(...batch.filter((i) => !i.pull_request));
    if (batch.length < 100) return out;
  }
}

const LABELS = {
  'auto:bloqueada': ['b60205', 'La pipeline nocturna falló dos veces con esta issue'],
  'auto:necesita-david': ['fbca04', 'La pipeline nocturna necesita información de David'],
  'en-staging': ['0e8a16', 'Hecha por la pipeline nocturna, fusionada en staging'],
  'resumen-nocturno': ['ededed', 'Registro de una noche de la pipeline'],
};

export async function ensureLabels() {
  const have = new Set((await gh('{repo}/labels?per_page=100')).map((l) => l.name));
  for (const [name, [color, description]] of Object.entries(LABELS)) {
    if (!have.has(name)) await gh('{repo}/labels', { method: 'POST', body: { name, color, description } });
  }
}

// Issue que hace de registro de la noche. Se crea sin asignar para no avisar de madrugada.
export async function nightLog(night = nightOf(), { create = true } = {}) {
  const title = `Noche ${night}`;
  const open = await gh(`{repo}/issues?labels=resumen-nocturno&state=all&per_page=20`);
  const found = open.find((i) => i.title === title);
  if (found || !create) return found ?? null;
  return gh('{repo}/issues', {
    method: 'POST',
    body: { title, labels: ['resumen-nocturno'], body: `Registro de la pipeline nocturna. El resumen llega a las 7:00.\n` },
  });
}

export const comment = (number, body) =>
  gh(`{repo}/issues/${number}/comments`, { method: 'POST', body: { body } });

export function output(key, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
  else console.log(`${key}=${value}`);
}
