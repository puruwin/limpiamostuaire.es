// deploy/Caddyfile con Caddy real:
// - El fichero entero valida (con un fichero de contraseñas de pruebas en lugar
//   del de staging, que solo existe en el VPS).
// - Levanta en local un sitio con los snippets (lo anterior a la línea
//   "# --- Sitios ---") sobre dist/ y comprueba:
//   - Todas las páginas de dist/ → 200 con las cabeceras de seguridad y sin
//     Server; lo que no existe → 404, y con contraseña → 401, las dos también
//     con las cabeceras.
//   - /_astro/* → Cache-Control immutable de un año; el HTML no.
//   - /index.html y /<ruta>/index.html → 301 a /<ruta>/; sin barra final →
//     301 con barra. La query se conserva.
// Necesita el binario de Caddy: variable CADDY o caddy en el PATH.
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const CADDY = process.env.CADDY || "caddy";
const MARKER = "# --- Sitios ---";
const STAGING_AUTH = "/etc/caddy/limpiamostuaire-staging.auth";

const SECURITY_HEADERS = {
  "strict-transport-security": /^max-age=31536000; includeSubDomains$/,
  "x-content-type-options": /^nosniff$/,
  "x-frame-options": /^DENY$/,
  "referrer-policy": /^strict-origin-when-cross-origin$/,
  "permissions-policy": /camera=\(\)/,
  "content-security-policy": /frame-ancestors 'none'/,
};
const IMMUTABLE = "public, max-age=31536000, immutable";

const files = (await readdir("dist", { recursive: true })).map((f) =>
  f.replace(/\\/g, "/"),
);
const pages = files
  .filter((f) => f.endsWith("index.html"))
  .map((f) => `/${f.replace(/index\.html$/, "")}`);
const hashed = files.find((f) => f.startsWith("_astro/") && /\.\w+$/.test(f));
if (pages.length === 0 || !hashed) {
  console.error(
    "No hay páginas o /_astro/ en dist/. Ejecuta antes npm run build.",
  );
  process.exit(1);
}

const REDIRECTS = {
  "/index.html": "/",
  "/index.html?a=1": "/?a=1",
  "/en/index.html": "/en/",
  "/en": "/en/",
  "/en?a=1": "/en/?a=1",
};
const NOT_FOUND = ["/no-existe/", "/en/no-existe/", "/no-existe/index.html"];

const caddyfile = await readFile("deploy/Caddyfile", "utf8");
const cut = caddyfile.indexOf(MARKER);
if (cut === -1 || !caddyfile.includes(`import ${STAGING_AUTH}`)) {
  console.error(
    `deploy/Caddyfile: falta la línea "${MARKER}" o "import ${STAGING_AUTH}".`,
  );
  process.exit(1);
}

const dir = await mkdtemp(join(tmpdir(), "check-caddy-"));
const globals = `{
	admin off
	auto_https off
	persist_config off
	storage file_system ${join(dir, "data")}
}
`;

// 1. El fichero entero, tal cual irá al VPS.
const auth = join(dir, "staging.auth");
// Hash del ejemplo de la documentación de Caddy (contraseña "hiccup").
await writeFile(
  auth,
  "Bob $2a$14$Zkx19XLiW6VYouLHR5NmfOFU0z2GTNmpkT/5qqR7hx4IjWJPDhjvG\n",
);
const full = join(dir, "Caddyfile.full");
await writeFile(full, globals + caddyfile.replace(STAGING_AUTH, auth));
validate(full);

// 2. Los snippets sobre dist/, en local.
const freePort = () =>
  new Promise((done, fail) => {
    const server = createServer().listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => done(port));
    });
    server.on("error", fail);
  });
const origin = `http://127.0.0.1:${await freePort()}`;
// Como staging: con contraseña, para ver que la 401 lleva las cabeceras.
const locked = `http://127.0.0.1:${await freePort()}`;
const config = join(dir, "Caddyfile");
await writeFile(
  config,
  `${globals}
${caddyfile.slice(0, cut)}
${origin} {
	root * ${resolve("dist")}
	import lta_static
}

${locked} {
	root * ${resolve("dist")}
	basic_auth {
		import ${auth}
	}
	import lta_static
}
`,
);
validate(config);

const caddy = spawn(
  CADDY,
  ["run", "--adapter", "caddyfile", "--config", config],
  { stdio: ["ignore", "ignore", "pipe"] },
);
let log = "";
caddy.stderr.on("data", (chunk) => (log += chunk));

const errors = [];
let checked = 0;
try {
  await waitFor(origin);

  for (const path of pages) {
    const res = await get(path, 200);
    securityHeaders(path, res);
    if (res.headers.get("cache-control") === IMMUTABLE) {
      errors.push(`${path}: el HTML no puede ir con Cache-Control immutable.`);
    }
  }
  const asset = await get(`/${hashed}`, 200);
  securityHeaders(`/${hashed}`, asset);
  if (asset.headers.get("cache-control") !== IMMUTABLE) {
    errors.push(
      `/${hashed}: Cache-Control ${JSON.stringify(asset.headers.get("cache-control"))}, debería ser "${IMMUTABLE}".`,
    );
  }
  for (const [from, to] of Object.entries(REDIRECTS)) {
    securityHeaders(from, await get(from, 301, to));
  }
  // En las de error, Server se queda (deploy/Caddyfile, header -Server).
  for (const path of NOT_FOUND) {
    securityHeaders(path, await get(path, 404), { server: false });
  }
  securityHeaders("/ con contraseña", await get("/", 401, undefined, locked), {
    server: false,
  });
} finally {
  caddy.kill();
  await rm(dir, { recursive: true, force: true });
}

function validate(file) {
  const result = spawnSync(
    CADDY,
    ["validate", "--adapter", "caddyfile", "--config", file],
    { encoding: "utf8" },
  );
  if (result.error || result.status !== 0) {
    console.error(
      result.error?.code === "ENOENT"
        ? `No encuentro Caddy (${CADDY}). Instálalo o indica el binario con CADDY=/ruta/caddy.`
        : `caddy validate falla:\n${result.stderr}`,
    );
    spawnSync("rm", ["-rf", dir]);
    process.exit(1);
  }
}

async function waitFor(url) {
  for (let i = 0; i < 100; i++) {
    if (caddy.exitCode !== null) break;
    try {
      await fetch(url, { redirect: "manual" });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error(`Caddy no arranca:\n${log}`);
}

async function get(path, status, location, base = origin) {
  checked++;
  const res = await fetch(base + path, { redirect: "manual" });
  await res.body?.cancel();
  const got = res.headers.get("location");
  if (res.status !== status || (location !== undefined && got !== location)) {
    errors.push(
      `${path}: ${res.status}${got ? ` → ${got}` : ""}, debería ser ${status}${location ? ` → ${location}` : ""}.`,
    );
  }
  return res;
}

function securityHeaders(path, res, { server = true } = {}) {
  for (const [name, expected] of Object.entries(SECURITY_HEADERS)) {
    const value = res.headers.get(name);
    if (value === null || !expected.test(value)) {
      errors.push(`${path}: ${name} ${JSON.stringify(value)}.`);
    }
  }
  if (server && res.headers.has("server")) {
    errors.push(`${path}: sobra la cabecera Server.`);
  }
}

if (errors.length > 0) {
  console.error(
    `deploy/Caddyfile: ${errors.length} problemas en ${checked} rutas:`,
  );
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
}
console.log(
  `deploy/Caddyfile OK: valida y ${checked} rutas con cabeceras, caché y redirecciones correctas.`,
);
