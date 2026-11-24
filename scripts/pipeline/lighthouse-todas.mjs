// Lighthouse sobre TODAS las páginas de dist/, no sobre una lista fija: una
// página nueva hecha sin supervisión también tiene que pasar el umbral.
import { readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { config } from './lib.mjs';

const cfg = config();
const pages = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f === 'index.html') pages.push('/' + relative('dist', dir).replace(/\\/g, '/') + (dir === 'dist' ? '' : '/'));
  }
})('dist');
const urls = pages.map((p) => `http://localhost${p.replace(/^\/\//, '/')}`);
console.log(`Lighthouse en ${urls.length} páginas`);

const min = cfg.lighthouseMinScore;
const assertion = ['error', { minScore: min, aggregationMethod: 'optimistic' }];
const rc = {
  ci: {
    collect: { staticDistDir: './dist', url: urls, numberOfRuns: 2 },
    assert: { assertions: Object.fromEntries(['performance', 'accessibility', 'best-practices', 'seo'].map((c) => [`categories:${c}`, assertion])) },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};
mkdirSync('.noche', { recursive: true });
writeFileSync('.noche/lighthouserc.json', JSON.stringify(rc, null, 2));
const r = spawnSync('npx', ['-y', '@lhci/cli@0.15.1', 'autorun', '--config=.noche/lighthouserc.json'], { stdio: 'inherit' });
process.exit(r.status ?? 1);
