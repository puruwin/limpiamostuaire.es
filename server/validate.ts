import { business } from "../src/data/business.ts";
import {
  OTHER_MUNICIPALITY,
  places,
  quoteFields as f,
  textLimits,
  yesNo,
  type Place,
  type QuoteErrorCode,
  type YesNo,
} from "../src/data/quote-form.ts";
import { defaultLocale, locales, type Locale } from "../src/i18n/locales.ts";

// Validación en servidor. Mismas reglas que el JS de
// src/components/bloques/Formulario.astro: el navegador ya avisa, pero
// aquí se decide.

export interface Quote {
  name: string;
  phone: string;
  email?: string;
  /** Nombre del municipio: el de la lista o el que escribió en «Otro». */
  municipality: string;
  municipalityIsOther: boolean;
  place: Place;
  splits: number;
  ducts?: YesNo;
  outdoor?: YesNo;
  message?: string;
  locale: Locale;
  /** Ruta de la web desde la que llegó al formulario. */
  origin: string;
}

export type FieldErrors = Record<string, QuoteErrorCode>;

export type ValidationResult =
  { ok: true; quote: Quote } | { ok: false; errors: FieldErrors };

// Más estricto que el del navegador: sin comillas dobles, comas ni <> (va a Reply-To).
const EMAIL =
  /^[^\s@<>,;:"()[\]\\]+@[^\s@<>,;:"()[\]\\]+\.[^\s@<>,;:"()[\]\\]+$/;
const PHONE = /^[0-9+().\s-]+$/;
const MAX_PHONE_DIGITS = 15;
const MAX_ORIGIN = 200;

/** Valor de texto de un campo; un fichero en un campo de texto cuenta como vacío. */
function raw(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

/** Una línea: sin caracteres de control y con los espacios agrupados. */
function line(form: FormData, name: string): string {
  return raw(form, name)
    .replace(/[\p{Cc}\p{Cf}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Texto de varias líneas: conserva los saltos, quita el resto de controles. */
function multiline(form: FormData, name: string): string {
  return raw(form, name)
    .replace(/\r\n?/g, "\n")
    .replace(/[^\P{Cc}\n\t]|\p{Cf}/gu, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const oneOf = <T extends string>(options: readonly T[], value: string) =>
  (options as readonly string[]).includes(value);

/** Idioma del envío; si no es uno de los del sitio, español. */
export function parseLocale(form: FormData): Locale {
  const value = raw(form, f.locale);
  return oneOf(locales, value) ? (value as Locale) : defaultLocale;
}

export function validateQuote(form: FormData): ValidationResult {
  const errors: FieldErrors = {};

  const name = line(form, f.name);
  if (!name) errors[f.name] = "required";
  else if (name.length > textLimits.name) errors[f.name] = "invalid";

  const phone = line(form, f.phone);
  const phoneDigits = phone.replace(/\D/g, "").length;
  if (!phone) errors[f.phone] = "required";
  else if (
    !PHONE.test(phone) ||
    phone.length > textLimits.phoneMax ||
    phoneDigits < textLimits.phoneMin ||
    phoneDigits > MAX_PHONE_DIGITS
  ) {
    errors[f.phone] = "invalid";
  }

  const email = line(form, f.email);
  if (email && (email.length > textLimits.email || !EMAIL.test(email))) {
    errors[f.email] = "invalid";
  }

  const listed = line(form, f.municipality);
  const isOther = listed === OTHER_MUNICIPALITY;
  let municipality = listed;
  if (!listed) errors[f.municipality] = "required";
  else if (isOther) {
    municipality = line(form, f.municipalityOther);
    if (!municipality) errors[f.municipalityOther] = "required";
    else if (municipality.length > textLimits.municipalityOther) {
      errors[f.municipalityOther] = "invalid";
    }
  } else if (!oneOf(business.areaServed, listed)) {
    errors[f.municipality] = "invalid";
  }

  const place = line(form, f.place);
  if (!place) errors[f.place] = "required";
  else if (!oneOf(places, place)) errors[f.place] = "invalid";

  const splitsText = line(form, f.splits);
  const splits = Number(splitsText);
  if (!splitsText) errors[f.splits] = "required";
  else if (
    !/^\d+$/.test(splitsText) ||
    splits < 1 ||
    splits > textLimits.splitsMax
  ) {
    errors[f.splits] = "invalid";
  }

  const ducts = line(form, f.ducts);
  if (ducts && !oneOf(yesNo, ducts)) errors[f.ducts] = "invalid";

  const outdoor = line(form, f.outdoor);
  if (outdoor && !oneOf(yesNo, outdoor)) errors[f.outdoor] = "invalid";

  const message = multiline(form, f.message);
  if (message.length > textLimits.message) errors[f.message] = "invalid";

  if (raw(form, f.privacy) !== "si") errors[f.privacy] = "required";

  const originText = line(form, f.origin);
  const origin =
    originText.startsWith("/") &&
    !originText.startsWith("//") &&
    originText.length <= MAX_ORIGIN
      ? originText
      : "";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    quote: {
      name,
      phone,
      email: email || undefined,
      municipality,
      municipalityIsOther: isOther,
      place: place as Place,
      splits,
      ducts: (ducts || undefined) as YesNo | undefined,
      outdoor: (outdoor || undefined) as YesNo | undefined,
      message: message || undefined,
      locale: parseLocale(form),
      origin,
    },
  };
}
