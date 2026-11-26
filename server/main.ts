import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  QUOTE_ENDPOINT,
  photoLimits,
  quoteFields as f,
  quoteResultPaths,
  type QuoteFormError,
} from "../src/data/quote-form.ts";
import type { Locale } from "../src/i18n/locales.ts";
import { BadBodyError, BodyTooLargeError, readForm } from "./body.ts";
import { loadConfig, type Config } from "./config.ts";
import { ackEmail, createSender, quoteEmail, type SendEmail } from "./mail.ts";
import {
  PHOTO_ROUTE,
  collectPhotos,
  deletePhotos,
  ensurePhotoDir,
  mimeOf,
  newRequestId,
  photoUrl,
  savePhotos,
  sweepPhotos,
  verifyPhotoLink,
} from "./photos.ts";
import { verifyTurnstile } from "./turnstile.ts";
import { parseLocale, validateQuote, type FieldErrors } from "./validate.ts";

// Endpoint del formulario de presupuesto (M3.2). Caddy le pasa
// /api/presupuesto/* (deploy/Caddyfile). Contrato: src/data/quote-form.ts.
// Los logs no llevan datos personales: solo el id de la solicitud y la causa.

/** Fotos al máximo y margen para el resto de campos y el multipart. */
const MAX_BODY = photoLimits.maxFiles * photoLimits.maxBytes + 2 * 1024 * 1024;
/** Envíos correctos por IP y ventana: frena el abuso del acuse. */
const RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 };
const SWEEP_EVERY_MS = 60 * 60 * 1000;

export interface Deps {
  /** fetch para Turnstile y Resend (los tests lo sustituyen). */
  fetch?: typeof fetch;
  now?: () => Date;
}

type Outcome =
  | { ok: true }
  | { ok: false; status: number; errors?: FieldErrors; error?: QuoteFormError };

const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

/** IP del cliente. X-Forwarded-For solo vale si la conexión viene de Caddy (local). */
function clientIp(req: IncomingMessage): string | undefined {
  const remote = req.socket.remoteAddress;
  const forwarded = req.headers["x-forwarded-for"];
  if (remote && LOOPBACK.has(remote) && typeof forwarded === "string") {
    return forwarded.split(",").at(-1)?.trim() || remote;
  }
  return remote;
}

function createRateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  const recent = (key: string, now: number) =>
    (hits.get(key) ?? []).filter((time) => now - time < windowMs);
  return {
    allowed(key: string, now: number) {
      return recent(key, now).length < max;
    },
    record(key: string, now: number) {
      hits.set(key, [...recent(key, now), now]);
      if (hits.size > 10_000) {
        for (const [k] of hits) if (recent(k, now).length === 0) hits.delete(k);
      }
    },
  };
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(json),
    "Cache-Control": "no-store",
  });
  res.end(json);
}

function sendText(res: ServerResponse, status: number, text: string) {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(text);
}

export function createApp(config: Config, deps: Deps = {}): Server {
  const fetchFn = deps.fetch ?? fetch;
  const now = deps.now ?? (() => new Date());
  const send: SendEmail = createSender(config.resendApiKey, fetchFn);
  const limiter = createRateLimiter(RATE_LIMIT.max, RATE_LIMIT.windowMs);

  async function handleQuote(
    req: IncomingMessage,
  ): Promise<{ locale: Locale; outcome: Outcome }> {
    const id = newRequestId();
    let form: FormData;
    try {
      form = await readForm(req, MAX_BODY);
    } catch (error) {
      if (error instanceof BodyTooLargeError) {
        console.warn(`presupuesto ${id}: cuerpo demasiado grande`);
        return {
          locale: "es",
          outcome: {
            ok: false,
            status: 413,
            errors: { [f.photos]: "tooLarge" },
          },
        };
      }
      if (error instanceof BadBodyError) {
        console.warn(`presupuesto ${id}: ${error.message}`);
        return {
          locale: "es",
          outcome: { ok: false, status: 400, error: "server" },
        };
      }
      throw error;
    }

    const locale = parseLocale(form);

    // Honeypot: se responde como si se hubiera enviado.
    const honeypot = form.get(f.honeypot);
    if (typeof honeypot === "string" && honeypot.trim() !== "") {
      console.info(`presupuesto ${id}: honeypot, descartado`);
      return { locale, outcome: { ok: true } };
    }

    const result = validateQuote(form);
    const photos = await collectPhotos(form);
    const errors: FieldErrors = result.ok ? {} : { ...result.errors };
    if (!photos.ok) errors[f.photos] = photos.error;
    if (!result.ok || !photos.ok) {
      console.info(
        `presupuesto ${id}: no válido (${Object.keys(errors).join(", ")})`,
      );
      return { locale, outcome: { ok: false, status: 422, errors } };
    }
    const { quote } = result;

    const ip = clientIp(req);
    const ipKey = ip ?? "desconocida";
    if (!limiter.allowed(ipKey, now().getTime())) {
      console.warn(`presupuesto ${id}: límite de envíos por IP`);
      return {
        locale,
        outcome: { ok: false, status: 429, error: "rateLimit" },
      };
    }

    const token = form.get(f.turnstile);
    const human = await verifyTurnstile(
      typeof token === "string" ? token : "",
      ip,
      config.turnstileSecret,
      fetchFn,
    );
    if (!human) {
      console.info(`presupuesto ${id}: Turnstile no superado`);
      return {
        locale,
        outcome: { ok: false, status: 403, error: "turnstile" },
      };
    }

    const date = now();
    let names: string[];
    try {
      names = await savePhotos(config.photoDir, id, photos.photos, date);
    } catch (error) {
      console.error(
        `presupuesto ${id}: no se pudieron guardar las fotos: ${String(error)}`,
      );
      return { locale, outcome: { ok: false, status: 500, error: "server" } };
    }
    const urls = names.map((name) =>
      photoUrl(config.publicUrl, name, config.signingSecret, date),
    );

    try {
      await send(quoteEmail(quote, urls, config), `presupuesto-${id}`);
    } catch (error) {
      console.error(
        `presupuesto ${id}: email a hola@ no enviado: ${String(error)}`,
      );
      await deletePhotos(config.photoDir, names);
      return { locale, outcome: { ok: false, status: 502, error: "server" } };
    }
    limiter.record(ipKey, date.getTime());

    if (quote.email) {
      try {
        await send(
          ackEmail({ ...quote, email: quote.email }, names.length, config),
          `acuse-${id}`,
        );
      } catch (error) {
        // La solicitud ya ha llegado a hola@: no se da por fallida.
        console.error(`presupuesto ${id}: acuse no enviado: ${String(error)}`);
      }
    }

    console.info(
      `presupuesto ${id}: enviado (idioma ${quote.locale}, fotos ${names.length}, acuse ${quote.email ? "sí" : "no"})`,
    );
    return { locale, outcome: { ok: true } };
  }

  async function handlePhoto(
    req: IncomingMessage,
    res: ServerResponse,
    url: URL,
  ) {
    const name = decodeURIComponent(url.pathname.slice(PHOTO_ROUTE.length));
    const valid = verifyPhotoLink(
      name,
      url.searchParams.get("exp"),
      url.searchParams.get("sig"),
      config.signingSecret,
      now(),
    );
    if (!valid) {
      sendText(res, 403, "Enlace no válido o caducado.");
      return;
    }
    const path = join(config.photoDir, name);
    let size: number;
    try {
      size = (await stat(path)).size;
    } catch {
      sendText(res, 404, "La foto ya no está en el servidor.");
      return;
    }
    res.writeHead(200, {
      "Content-Type": mimeOf(name),
      "Content-Length": size,
      "Content-Disposition": `inline; filename="${name}"`,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    createReadStream(path).pipe(res);
  }

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");

      if (url.pathname === QUOTE_ENDPOINT) {
        if (req.method !== "POST") {
          res.setHeader("Allow", "POST");
          sendText(res, 405, "Método no permitido.");
          return;
        }
        const wantsJson = (req.headers.accept ?? "").includes(
          "application/json",
        );
        const { locale, outcome } = await handleQuote(req);
        if (wantsJson) {
          sendJson(
            res,
            outcome.ok ? 200 : outcome.status,
            outcome.ok
              ? { ok: true }
              : { ok: false, errors: outcome.errors, error: outcome.error },
          );
        } else {
          // Sin JS: a la página de resultado del idioma del formulario.
          const paths = quoteResultPaths[locale];
          res.writeHead(303, {
            Location: outcome.ok ? paths.sent : paths.error,
            "Cache-Control": "no-store",
          });
          res.end();
        }
        return;
      }

      if (url.pathname.startsWith(PHOTO_ROUTE)) {
        if (req.method !== "GET" && req.method !== "HEAD") {
          res.setHeader("Allow", "GET, HEAD");
          sendText(res, 405, "Método no permitido.");
          return;
        }
        await handlePhoto(req, res, url);
        return;
      }

      sendText(res, 404, "No encontrado.");
    } catch (error) {
      console.error(`error inesperado: ${String(error)}`);
      if (!res.headersSent) sendText(res, 500, "Error del servidor.");
      else res.destroy();
    }
  });
  // Subidas de 50 MB desde el móvil: más margen que los 5 min por defecto.
  server.requestTimeout = 15 * 60 * 1000;
  return server;
}

async function sweep(dir: string) {
  try {
    const deleted = await sweepPhotos(dir, new Date());
    if (deleted > 0) console.info(`fotos: ${deleted} borradas por caducidad`);
  } catch (error) {
    console.error(`fotos: no se pudo hacer el barrido: ${String(error)}`);
  }
}

export async function start(config = loadConfig()): Promise<Server> {
  await ensurePhotoDir(config.photoDir);
  await sweep(config.photoDir);
  setInterval(() => void sweep(config.photoDir), SWEEP_EVERY_MS).unref();

  const server = createApp(config);
  await new Promise<void>((resolve) =>
    server.listen(config.port, "127.0.0.1", resolve),
  );
  console.info(
    `limpiamostuaire-api en http://127.0.0.1:${config.port}${QUOTE_ENDPOINT}` +
      (config.resendApiKey ? "" : " (sin RESEND_API_KEY: emails a la consola)"),
  );
  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => server.close(() => process.exit(0)));
  }
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  start().catch((error: unknown) => {
    console.error(String(error));
    process.exit(1);
  });
}
