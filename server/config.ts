import { resolve } from "node:path";

// Configuración del servicio, solo desde variables de entorno (los secretos
// nunca van en el repo). En el VPS las pone systemd desde
// /etc/limpiamostuaire/api-<instancia>.env (docs/despliegue.md). Con
// NODE_ENV=production, si falta una variable obligatoria el servicio no arranca.

export interface Config {
  port: number;
  /** URL pública del sitio, sin barra final: base de los enlaces a las fotos. */
  publicUrl: string;
  /** Carpeta de las fotos, fuera del directorio que sirve Caddy. */
  photoDir: string;
  /** Secreto para firmar los enlaces a las fotos. */
  signingSecret: string;
  turnstileSecret: string;
  /** Sin clave (solo en desarrollo), los emails se escriben en la consola. */
  resendApiKey: string;
  mailFrom: string;
  /** Buzones que reciben las solicitudes (hola@; en staging, el tuyo). En el
   * entorno, MAIL_TO con las direcciones separadas por comas. */
  mailTo: string[];
  /** Prefijo del asunto, por ejemplo "[staging] ". */
  subjectPrefix: string;
}

// Claves de prueba de Cloudflare: el token siempre es válido.
// https://developers.cloudflare.com/turnstile/troubleshooting/testing/
const TURNSTILE_TEST_SECRET = "1x0000000000000000000000000000000AA";

/** Puerto por defecto: el de producción. rqpbioclean.es usa 4301 y 4302. */
export const DEFAULT_PORT = 4311;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const production = env.NODE_ENV === "production";
  const missing: string[] = [];

  const get = (name: string, devDefault: string): string => {
    const value = env[name]?.trim();
    if (value) return value;
    if (production) missing.push(name);
    return devDefault;
  };

  const config: Config = {
    port: Number(env.PORT ?? DEFAULT_PORT),
    publicUrl: get("PUBLIC_URL", "http://localhost:4321").replace(/\/+$/, ""),
    photoDir: resolve(
      env.PHOTO_DIR?.trim() || env.STATE_DIRECTORY?.trim() || ".data/fotos",
    ),
    signingSecret: get("PHOTO_SIGNING_SECRET", "solo-para-desarrollo"),
    turnstileSecret: get("TURNSTILE_SECRET_KEY", TURNSTILE_TEST_SECRET),
    resendApiKey: get("RESEND_API_KEY", ""),
    mailFrom: get(
      "MAIL_FROM",
      "Limpiamos tu aire <formulario@avisos.limpiamostuaire.es>",
    ),
    mailTo: get("MAIL_TO", "desarrollo@example.com")
      .split(",")
      .map((address) => address.trim())
      .filter(Boolean),
    subjectPrefix: env.MAIL_SUBJECT_PREFIX ?? "",
  };

  if (!Number.isInteger(config.port) || config.port <= 0) {
    missing.push("PORT");
  }
  if (
    production &&
    !missing.includes("PHOTO_SIGNING_SECRET") &&
    config.signingSecret.length < 32
  ) {
    missing.push("PHOTO_SIGNING_SECRET (32 caracteres como mínimo)");
  }
  if (
    !missing.includes("MAIL_TO") &&
    (config.mailTo.length === 0 ||
      config.mailTo.some((address) => !/^[^\s@]+@[^\s@]+$/.test(address)))
  ) {
    missing.push("MAIL_TO (direcciones separadas por comas)");
  }
  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno: ${missing.join(", ")}`);
  }
  return config;
}
