import { business } from "../src/data/business.ts";
import { PHOTO_RETENTION_DAYS } from "../src/data/quote-form.ts";
import type { Locale } from "../src/i18n/locales.ts";
import { useTranslations, type UiKey } from "../src/i18n/ui.ts";
import type { Config } from "./config.ts";
import type { Quote } from "./validate.ts";

// Emails del formulario, enviados con la API de Resend:
// - A hola@, en español, con los datos ordenados y los enlaces a las fotos.
// - Acuse al cliente en su idioma, si dejó email, con la copia de la solicitud.

export interface Email {
  from: string;
  to: string[];
  reply_to?: string | string[];
  subject: string;
  text: string;
  html: string;
}

type Row = { label: string; text: string; html?: string };

const RESEND_API = "https://api.resend.com/emails";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));

/** «1 split» / «3 splits», en el idioma. */
function splitsText(locale: Locale, count: number): string {
  const t = useTranslations(locale);
  return count === 1
    ? t("table.splits.one")
    : fill(t("table.splits.other"), { count });
}

/** Enlace tel: con solo dígitos y +. */
function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/**
 * Número para wa.me (prefijo de país sin +), o null si no se puede deducir:
 * con + o 00 delante, tal cual; 9 cifras que empiezan por 6, 7, 8 o 9, España.
 */
export function whatsappNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return digits;
  if (trimmed.startsWith("00")) return digits.slice(2);
  if (/^[6-9]\d{8}$/.test(digits)) return `34${digits}`;
  return null;
}

function link(href: string, text: string): string {
  return `<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`;
}

function render(intro: string[], rows: Row[], outro: string[]) {
  const text = [
    intro.join("\n\n"),
    rows
      .map((row) =>
        row.text.includes("\n")
          ? `${row.label}:\n${row.text}`
          : `${row.label}: ${row.text}`,
      )
      .join("\n"),
    outro.join("\n\n"),
  ].join("\n\n");

  const paragraphs = (lines: string[]) =>
    lines.map((value) => `<p>${escapeHtml(value)}</p>`).join("\n");
  const cell = "padding:6px 12px 6px 0;vertical-align:top;text-align:left";
  const table = rows
    .map(
      (row) =>
        `<tr><th style="${cell}">${escapeHtml(row.label)}</th>` +
        `<td style="${cell};white-space:pre-wrap">${row.html ?? escapeHtml(row.text)}</td></tr>`,
    )
    .join("\n");
  const html = `<!doctype html>
<html><body style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#12313f">
${paragraphs(intro)}
<table style="border-collapse:collapse">
${table}
</table>
${paragraphs(outro)}
</body></html>`;
  return { text, html };
}

/** Filas de la solicitud con las etiquetas del formulario en `locale`. */
function quoteRows(quote: Quote, locale: Locale): Row[] {
  const t = useTranslations(locale);
  const answer = (value: "si" | "no") =>
    t(value === "si" ? "form.yes" : "form.no");
  const rows: Row[] = [
    { label: t("form.name"), text: quote.name },
    { label: t("form.phone"), text: quote.phone },
  ];
  if (quote.email) rows.push({ label: t("form.email"), text: quote.email });
  rows.push(
    { label: t("form.municipality"), text: quote.municipality },
    {
      label: t("form.place"),
      text: t(`form.place.${quote.place}` as UiKey),
    },
    { label: t("form.splits"), text: String(quote.splits) },
  );
  if (quote.ducts) {
    rows.push({ label: t("form.ducts"), text: answer(quote.ducts) });
  }
  if (quote.outdoor) {
    rows.push({ label: t("form.outdoor"), text: answer(quote.outdoor) });
  }
  if (quote.message) {
    rows.push({ label: t("form.message"), text: quote.message });
  }
  return rows;
}

/** Email a hola@: asunto con municipio y número de splits. */
export function quoteEmail(
  quote: Quote,
  photoUrls: string[],
  config: Config,
): Email {
  const t = useTranslations("es");
  const rows = quoteRows(quote, "es");

  const phone = rows.find((row) => row.label === t("form.phone"));
  if (phone) {
    const wa = whatsappNumber(quote.phone);
    phone.html =
      link(telHref(quote.phone), quote.phone) +
      (wa ? ` · ${link(`https://wa.me/${wa}`, "WhatsApp")}` : "");
  }
  const email = rows.find((row) => row.label === t("form.email"));
  if (email && quote.email) {
    email.html = link(`mailto:${quote.email}`, quote.email);
  }
  const municipality = rows.find((row) => row.label === t("form.municipality"));
  if (municipality && quote.municipalityIsOther) {
    municipality.text += " (otro, escrito por el cliente)";
  }

  if (photoUrls.length > 0) {
    rows.push({
      label: t("form.photos"),
      text: photoUrls.join("\n"),
      html: photoUrls.map((url, i) => link(url, `Foto ${i + 1}`)).join("<br>"),
    });
  }
  rows.push({ label: "Idioma", text: t(`lang.${quote.locale}` as UiKey) });
  if (quote.origin) {
    const url = `${config.publicUrl}${quote.origin}`;
    rows.push({
      label: "Enviado desde",
      text: url,
      html: link(url, quote.origin),
    });
  }

  const outro = [
    photoUrls.length > 0
      ? `Los enlaces a las fotos caducan a los ${PHOTO_RETENTION_DAYS} días: entonces se borran del servidor. Si te hacen falta, guárdalas antes.`
      : "Sin fotos.",
    quote.email
      ? "Si respondes a este email, la respuesta le llega al cliente."
      : "El cliente no ha dejado email: contesta por teléfono o WhatsApp.",
  ];

  return {
    from: config.mailFrom,
    to: config.mailTo,
    reply_to: quote.email,
    subject: `${config.subjectPrefix}Presupuesto · ${quote.municipality} · ${splitsText("es", quote.splits)}`,
    ...render(["Nueva solicitud de presupuesto desde la web."], rows, outro),
  };
}

/** Acuse al cliente, en su idioma. Solo si dejó email. */
export function ackEmail(
  quote: Quote & { email: string },
  photoCount: number,
  config: Config,
): Email {
  const t = useTranslations(quote.locale);
  const rows = quoteRows(quote, quote.locale);
  if (photoCount > 0) {
    rows.push({ label: t("form.photos"), text: String(photoCount) });
  }
  return {
    from: config.mailFrom,
    to: [quote.email],
    reply_to: config.mailTo,
    subject: `${config.subjectPrefix}${t("email.ack.subject")}`,
    ...render(
      [
        fill(t("email.ack.greeting"), { name: quote.name }),
        t("email.ack.text"),
        t("email.ack.copy"),
      ],
      rows,
      [
        fill(t("email.ack.contact"), { phone: business.phone.display }),
        `${business.brand} · ${t("footer.hours")}`,
      ],
    ),
  };
}

export type SendEmail = (email: Email, idempotencyKey: string) => Promise<void>;

/**
 * Envío con Resend. Sin clave (desarrollo), escribe el email en la consola.
 * Lanza un error si Resend no lo acepta.
 */
export function createSender(apiKey: string, fetchFn: typeof fetch): SendEmail {
  if (!apiKey) {
    return async (email) => {
      console.info(
        `\n--- email (sin RESEND_API_KEY, no se envía) ---\nDe: ${email.from}\nPara: ${email.to.join(", ")}\nResponder a: ${[email.reply_to ?? "-"].flat().join(", ")}\nAsunto: ${email.subject}\n\n${email.text}\n---\n`,
      );
    };
  }
  return async (email, idempotencyKey) => {
    const response = await fetchFn(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(email),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      const detail = (await response.text().catch(() => "")).slice(0, 300);
      throw new Error(`Resend ${response.status}: ${detail}`);
    }
  };
}
