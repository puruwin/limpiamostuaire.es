import assert from "node:assert/strict";
import { mkdtemp, readdir, rm, utimes, writeFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, beforeEach, describe, test } from "node:test";
import { loadConfig, type Config } from "./config.ts";
import { createApp } from "./main.ts";
import { escapeHtml, whatsappNumber } from "./mail.ts";
import {
  PHOTO_ROUTE,
  RETENTION_MS,
  photoUrl,
  sniffPhoto,
  sweepPhotos,
  verifyPhotoLink,
} from "./photos.ts";
import { validateQuote } from "./validate.ts";

// Bytes mínimos de cada formato (cabecera suficiente para reconocerlo).
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array(16).fill(0)]);
const PNG = new Uint8Array([
  0x89,
  0x50,
  0x4e,
  0x47,
  0x0d,
  0x0a,
  0x1a,
  0x0a,
  ...new Array(12).fill(0),
]);
const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));
const WEBP = new Uint8Array([
  ...ascii("RIFF"),
  0,
  0,
  0,
  0,
  ...ascii("WEBPVP8 "),
]);
const HEIC = new Uint8Array([0, 0, 0, 24, ...ascii("ftypheic"), 0, 0, 0, 0]);
const HEIF = new Uint8Array([0, 0, 0, 24, ...ascii("ftypmif1"), 0, 0, 0, 0]);
const PDF = new Uint8Array(ascii("%PDF-1.7 fake pdf file"));

const valid: Record<string, string> = {
  nombre: "Ana Pérez",
  telefono: "+34 612 34 56 78",
  email: "ana@example.com",
  municipio: "Benidorm",
  tipo: "casa",
  splits: "3",
  conductos: "no",
  exterior: "si",
  mensaje: "Dos en los dormitorios\r\ny uno en el salón.",
  privacidad: "si",
  idioma: "es",
  origen: "/precios/",
  "cf-turnstile-response": "token-de-prueba",
};

function formOf(
  fields: Record<string, string | undefined>,
  photos: Uint8Array[] = [],
) {
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    if (value !== undefined) form.append(name, value);
  }
  for (const [i, bytes] of photos.entries()) {
    form.append("fotos", new Blob([bytes as BlobPart]), `foto-${i}.jpg`);
  }
  return form;
}

describe("loadConfig", () => {
  const production = {
    NODE_ENV: "production",
    PUBLIC_URL: "https://limpiamostuaire.es",
    PHOTO_SIGNING_SECRET: "x".repeat(32),
    TURNSTILE_SECRET_KEY: "secreto",
    RESEND_API_KEY: "re_x",
    MAIL_FROM: "Limpiamos tu aire <a@avisos.limpiamostuaire.es>",
  };

  test("MAIL_TO admite varias direcciones separadas por comas", () => {
    const config = loadConfig({
      ...production,
      MAIL_TO: " uno@example.com, otro@example.com ,",
    });
    assert.deepEqual(config.mailTo, ["uno@example.com", "otro@example.com"]);
  });

  test("MAIL_TO con algo que no es un email no arranca", () => {
    assert.throws(
      () =>
        loadConfig({ ...production, MAIL_TO: "uno@example.com; otro@x.com" }),
      /MAIL_TO/,
    );
  });
});

describe("validateQuote", () => {
  test("acepta un envío completo y limpia los textos", () => {
    const result = validateQuote(formOf(valid));
    assert.ok(result.ok);
    assert.equal(result.quote.name, "Ana Pérez");
    assert.equal(result.quote.splits, 3);
    assert.equal(result.quote.ducts, "no");
    assert.equal(result.quote.outdoor, "si");
    assert.equal(
      result.quote.message,
      "Dos en los dormitorios\ny uno en el salón.",
    );
    assert.equal(result.quote.locale, "es");
    assert.equal(result.quote.origin, "/precios/");
  });

  test("admite apóstrofos en el email", () => {
    const result = validateQuote(
      formOf({ ...valid, email: "o'brien@example.com" }),
    );
    assert.ok(result.ok);
  });

  test("solo los obligatorios", () => {
    const result = validateQuote(
      formOf({
        nombre: "Ana",
        telefono: "612345678",
        municipio: "Altea",
        tipo: "negocio",
        splits: "1",
        privacidad: "si",
      }),
    );
    assert.ok(result.ok);
    assert.equal(result.quote.email, undefined);
    assert.equal(result.quote.ducts, undefined);
    assert.equal(result.quote.outdoor, undefined);
  });

  test("marca los obligatorios que faltan", () => {
    const result = validateQuote(formOf({}));
    assert.ok(!result.ok);
    assert.deepEqual(result.errors, {
      nombre: "required",
      telefono: "required",
      municipio: "required",
      tipo: "required",
      splits: "required",
      privacidad: "required",
    });
  });

  for (const [field, value] of [
    ["telefono", "123"],
    ["telefono", "612345678abc"],
    ["telefono", "+1 234 567 890 123 456"],
    ["email", "no-es-un-email"],
    ["email", '"x"@example.com'],
    ["municipio", "Madrid"],
    ["tipo", "vivienda"],
    ["splits", "0"],
    ["splits", "201"],
    ["splits", "2.5"],
    ["splits", "dos"],
    ["conductos", "quizá"],
    ["exterior", "on"],
    ["nombre", "x".repeat(101)],
    ["mensaje", "x".repeat(2001)],
  ] as const) {
    test(`rechaza ${field}=${value.slice(0, 20)}`, () => {
      const result = validateQuote(formOf({ ...valid, [field]: value }));
      assert.ok(!result.ok);
      assert.equal(result.errors[field], "invalid");
    });
  }

  test("«Otro» municipio pide el nombre y lo usa", () => {
    const missing = validateQuote(formOf({ ...valid, municipio: "otro" }));
    assert.ok(!missing.ok);
    assert.equal(missing.errors.municipio_otro, "required");

    const ok = validateQuote(
      formOf({ ...valid, municipio: "otro", municipio_otro: "Finestrat" }),
    );
    assert.ok(ok.ok);
    assert.equal(ok.quote.municipality, "Finestrat");
    assert.equal(ok.quote.municipalityIsOther, true);
  });

  test("la privacidad tiene que ser «si»", () => {
    const result = validateQuote(formOf({ ...valid, privacidad: "on" }));
    assert.ok(!result.ok);
    assert.equal(result.errors.privacidad, "required");
  });

  test("idioma desconocido → español; origen externo → vacío", () => {
    const result = validateQuote(
      formOf({ ...valid, idioma: "fr", origen: "//evil.example/" }),
    );
    assert.ok(result.ok);
    assert.equal(result.quote.locale, "es");
    assert.equal(result.quote.origin, "");
  });
});

describe("fotos", () => {
  test("reconoce el tipo por el contenido", () => {
    assert.equal(sniffPhoto(JPEG)?.ext, "jpg");
    assert.equal(sniffPhoto(PNG)?.ext, "png");
    assert.equal(sniffPhoto(WEBP)?.ext, "webp");
    assert.equal(sniffPhoto(HEIC)?.ext, "heic");
    assert.equal(sniffPhoto(HEIF)?.ext, "heif");
    assert.equal(sniffPhoto(PDF), null);
    assert.equal(sniffPhoto(new Uint8Array(3)), null);
  });

  const secret = "x".repeat(32);
  const now = new Date("2026-11-11T12:00:00Z");
  const name = "20261111-120000-0123456789ab-1.jpg";

  test("enlace firmado: válido, manipulado y caducado", () => {
    const url = new URL(
      photoUrl("https://limpiamostuaire.es", name, secret, now),
    );
    assert.equal(url.pathname, `${PHOTO_ROUTE}${name}`);
    const exp = url.searchParams.get("exp");
    const sig = url.searchParams.get("sig");
    assert.ok(verifyPhotoLink(name, exp, sig, secret, now));
    assert.ok(!verifyPhotoLink(name, exp, `${sig}x`, secret, now));
    assert.ok(
      !verifyPhotoLink(name, String(Number(exp) + 1), sig, secret, now),
    );
    assert.ok(!verifyPhotoLink(name, exp, sig, "y".repeat(32), now));
    const later = new Date(now.getTime() + RETENTION_MS + 1000);
    assert.ok(!verifyPhotoLink(name, exp, sig, secret, later));
  });

  test("rechaza nombres fuera del patrón", () => {
    for (const bad of [
      "../secreto.jpg",
      "20261111-120000-0123456789ab-1.jpg/../../x",
      "20261111-120000-0123456789ab-1.svg",
    ]) {
      assert.ok(!verifyPhotoLink(bad, "9999999999", "x", secret, now));
    }
  });

  test("el barrido borra solo las fotos caducadas", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lta-fotos-"));
    try {
      const old = "20261001-120000-0123456789ab-1.jpg";
      const fresh = "20261111-120000-0123456789ab-2.jpg";
      const other = "no-tocar.txt";
      for (const file of [old, fresh, other]) {
        await writeFile(join(dir, file), "x");
      }
      const past = new Date(Date.now() - RETENTION_MS - 60_000);
      await utimes(join(dir, old), past, past);
      await utimes(join(dir, other), past, past);
      assert.equal(await sweepPhotos(dir, new Date()), 1);
      assert.deepEqual((await readdir(dir)).sort(), [fresh, other].sort());
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe("mail", () => {
  test("escapa HTML", () => {
    assert.equal(
      escapeHtml(`<a href="x">'&'</a>`),
      "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;",
    );
  });

  test("número de WhatsApp", () => {
    assert.equal(whatsappNumber("612 34 56 78"), "34612345678");
    assert.equal(whatsappNumber("+47 912 34 567"), "4791234567");
    assert.equal(whatsappNumber("0047 912 34 567"), "4791234567");
    assert.equal(whatsappNumber("12345678"), null);
  });
});

describe("endpoint", () => {
  let dir: string;
  let base: string;
  let close: () => Promise<void>;
  let turnstileOk = true;
  let resendStatus = 200;
  let sent: {
    to: string[];
    subject: string;
    html: string;
    reply_to?: string;
  }[] = [];
  let turnstileCalls = 0;

  const fakeFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    if (url.includes("turnstile")) {
      turnstileCalls++;
      return Response.json({ success: turnstileOk });
    }
    if (url.includes("resend")) {
      if (resendStatus === 200) sent.push(JSON.parse(String(init?.body)));
      return new Response("{}", { status: resendStatus });
    }
    throw new Error(`fetch inesperado: ${url}`);
  };

  before(async () => {
    dir = await mkdtemp(join(tmpdir(), "lta-api-"));
    const config: Config = {
      ...loadConfig({ NODE_ENV: "test" }),
      photoDir: dir,
      publicUrl: "https://limpiamostuaire.es",
      resendApiKey: "re_test",
      mailTo: ["hola@example.com"],
    };
    const server = createApp(config, { fetch: fakeFetch });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    close = () => new Promise((resolve) => server.close(() => resolve()));
  });

  after(async () => {
    await close();
    await rm(dir, { recursive: true, force: true });
  });

  beforeEach(() => {
    turnstileOk = true;
    resendStatus = 200;
    sent = [];
    turnstileCalls = 0;
  });

  const post = (form: FormData, json = true, ip = "203.0.113.1") =>
    fetch(`${base}/api/presupuesto/`, {
      method: "POST",
      body: form,
      redirect: "manual",
      headers: {
        ...(json ? { Accept: "application/json" } : {}),
        "X-Forwarded-For": ip,
      },
    });

  test("envío correcto con fotos: email a hola@, acuse y enlaces que funcionan", async () => {
    const response = await post(
      formOf({ ...valid, idioma: "en" }, [JPEG, HEIC]),
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });

    assert.equal(sent.length, 2);
    const [toHola, ack] = sent;
    assert.deepEqual(toHola.to, ["hola@example.com"]);
    assert.equal(toHola.reply_to, "ana@example.com");
    assert.equal(toHola.subject, "Presupuesto · Benidorm · 3 splits");
    assert.deepEqual(ack.to, ["ana@example.com"]);
    assert.equal(
      ack.subject,
      "We have received your request · Limpiamos tu aire",
    );

    const files = (await readdir(dir)).sort();
    assert.equal(files.length, 2);
    assert.match(files[0], /-1\.jpg$/);
    assert.match(files[1], /-2\.heic$/);

    const links = [
      ...toHola.html.matchAll(
        /href="(https:\/\/limpiamostuaire[^"]+fotos[^"]+)"/g,
      ),
    ].map((m) => m[1].replaceAll("&amp;", "&"));
    assert.equal(links.length, 2);
    const photo = await fetch(
      links[0].replace("https://limpiamostuaire.es", base),
    );
    assert.equal(photo.status, 200);
    assert.equal(photo.headers.get("content-type"), "image/jpeg");
    assert.deepEqual(new Uint8Array(await photo.arrayBuffer()), JPEG);

    const tampered = await fetch(
      links[0]
        .replace("https://limpiamostuaire.es", base)
        .replace("sig=", "sig=x"),
    );
    assert.equal(tampered.status, 403);
  });

  test("sin JS: 303 a la página de resultado del idioma", async () => {
    const ok = await post(
      formOf({ ...valid, idioma: "en" }),
      false,
      "203.0.113.2",
    );
    assert.equal(ok.status, 303);
    assert.equal(ok.headers.get("location"), "/en/contact/sent/");

    const bad = await post(formOf({ idioma: "es" }), false, "203.0.113.2");
    assert.equal(bad.status, 303);
    assert.equal(bad.headers.get("location"), "/contacto/error/");
  });

  test("honeypot relleno: éxito aparente, sin emails ni Turnstile", async () => {
    const response = await post(formOf({ ...valid, web: "http://spam" }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(sent.length, 0);
    assert.equal(turnstileCalls, 0);
  });

  test("errores de campo antes de gastar el token de Turnstile", async () => {
    const response = await post(formOf({ ...valid, telefono: "12" }, [PDF]));
    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), {
      ok: false,
      errors: { telefono: "invalid", fotos: "fileType" },
    });
    assert.equal(turnstileCalls, 0);
  });

  test("más de 5 fotos", async () => {
    const response = await post(formOf(valid, new Array(6).fill(JPEG)));
    assert.equal(response.status, 422);
    assert.deepEqual((await response.json()).errors, { fotos: "tooMany" });
  });

  test("Turnstile no superado o sin token", async () => {
    turnstileOk = false;
    const response = await post(formOf(valid));
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { ok: false, error: "turnstile" });

    turnstileOk = true;
    const noToken = await post(
      formOf({ ...valid, "cf-turnstile-response": undefined }),
    );
    assert.equal(noToken.status, 403);
    assert.equal(sent.length, 0);
  });

  test("si falla el email a hola@, error y fotos borradas", async () => {
    const before = (await readdir(dir)).length;
    resendStatus = 500;
    const response = await post(formOf(valid, [PNG]), true, "203.0.113.3");
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { ok: false, error: "server" });
    assert.equal((await readdir(dir)).length, before);
  });

  test("sin email no hay acuse", async () => {
    await post(formOf({ ...valid, email: undefined }), true, "203.0.113.4");
    assert.equal(sent.length, 1);
    assert.equal(sent[0].reply_to, undefined);
  });

  test("límite de envíos por IP", async () => {
    const ip = "203.0.113.5";
    for (let i = 0; i < 5; i++) {
      assert.equal((await post(formOf(valid), true, ip)).status, 200);
    }
    const blocked = await post(formOf(valid), true, ip);
    assert.equal(blocked.status, 429);
    assert.deepEqual(await blocked.json(), { ok: false, error: "rateLimit" });
    assert.equal((await post(formOf(valid), true, "203.0.113.6")).status, 200);
  });

  test("métodos y rutas", async () => {
    assert.equal((await fetch(`${base}/api/presupuesto/`)).status, 405);
    assert.equal((await fetch(`${base}/otra/`)).status, 404);
    assert.equal(
      (
        await fetch(
          `${base}/api/presupuesto/fotos/..%2F..%2Fetc%2Fpasswd?exp=9999999999&sig=x`,
        )
      ).status,
      403,
    );
  });
});
