import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, readdir, stat, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  PHOTO_RETENTION_DAYS,
  photoLimits,
  quoteFields as f,
  type QuoteErrorCode,
} from "../src/data/quote-form.ts";

// Fotos del formulario: se comprueban por su contenido, se guardan con un
// nombre nuevo fuera del directorio público y se sirven con un enlace firmado
// que caduca cuando se borran (PHOTO_RETENTION_DAYS, política de privacidad).

export const RETENTION_MS = PHOTO_RETENTION_DAYS * 24 * 60 * 60 * 1000;
export const PHOTO_ROUTE = "/api/presupuesto/fotos/";

export interface PhotoType {
  ext: "jpg" | "png" | "webp" | "heic" | "heif";
  mime: (typeof photoLimits.types)[number];
}

export interface Photo {
  bytes: Uint8Array;
  type: PhotoType;
}

/** Nombre de un fichero guardado: AAAAMMDD-HHMMSS-<id>-<n>.<ext>. */
export const PHOTO_NAME =
  /^\d{8}-\d{6}-[0-9a-f]{12}-[1-9]\.(jpg|png|webp|heic|heif)$/;

const MIME_BY_EXT: Record<PhotoType["ext"], PhotoType["mime"]> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

// Marcas de la caja `ftyp` de HEIC (HEVC) y HEIF genérico.
const HEIC_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis"]);
const HEIF_BRANDS = new Set(["mif1", "msf1"]);

const ascii = (bytes: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...bytes.subarray(start, end));

/** Tipo real de la imagen según sus primeros bytes, o null si no es de las admitidas. */
export function sniffPhoto(bytes: Uint8Array): PhotoType | null {
  const type = (ext: PhotoType["ext"]): PhotoType => ({
    ext,
    mime: MIME_BY_EXT[ext],
  });
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return type("jpg");
  }
  if (
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (byte, i) => bytes[i] === byte,
    )
  ) {
    return type("png");
  }
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") {
    return type("webp");
  }
  if (ascii(bytes, 4, 8) === "ftyp") {
    const brand = ascii(bytes, 8, 12);
    if (HEIC_BRANDS.has(brand)) return type("heic");
    if (HEIF_BRANDS.has(brand)) return type("heif");
  }
  return null;
}

export type PhotosResult =
  { ok: true; photos: Photo[] } | { ok: false; error: QuoteErrorCode };

/** Fotos del envío. Las partes vacías (input sin ficheros) no cuentan. */
export async function collectPhotos(form: FormData): Promise<PhotosResult> {
  const files = form
    .getAll(f.photos)
    .filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length > photoLimits.maxFiles)
    return { ok: false, error: "tooMany" };
  if (files.some((file) => file.size > photoLimits.maxBytes)) {
    return { ok: false, error: "tooLarge" };
  }
  const photos: Photo[] = [];
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = sniffPhoto(bytes);
    if (!type) return { ok: false, error: "fileType" };
    photos.push({ bytes, type });
  }
  return { ok: true, photos };
}

/** Id de solicitud: también va en el nombre de sus fotos. */
export function newRequestId(): string {
  return randomBytes(6).toString("hex");
}

function stamp(date: Date): string {
  const iso = date.toISOString(); // 2026-11-11T14:30:12.345Z
  return `${iso.slice(0, 10).replaceAll("-", "")}-${iso.slice(11, 19).replaceAll(":", "")}`;
}

/** Guarda las fotos y devuelve sus nombres. */
export async function savePhotos(
  dir: string,
  id: string,
  photos: Photo[],
  now: Date,
): Promise<string[]> {
  const names: string[] = [];
  try {
    for (const [index, photo] of photos.entries()) {
      const name = `${stamp(now)}-${id}-${index + 1}.${photo.type.ext}`;
      await writeFile(join(dir, name), photo.bytes, {
        mode: 0o600,
        flag: "wx",
      });
      names.push(name);
    }
  } catch (error) {
    await deletePhotos(dir, names);
    throw error;
  }
  return names;
}

export async function deletePhotos(
  dir: string,
  names: string[],
): Promise<void> {
  await Promise.all(
    names.map((name) => unlink(join(dir, name)).catch(() => undefined)),
  );
}

function signature(name: string, expires: number, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${name}.${expires}`)
    .digest("base64url");
}

/** Enlace firmado a una foto; caduca a la vez que se borra el fichero. */
export function photoUrl(
  publicUrl: string,
  name: string,
  secret: string,
  now: Date,
): string {
  const expires = Math.floor((now.getTime() + RETENTION_MS) / 1000);
  const sig = signature(name, expires, secret);
  return `${publicUrl}${PHOTO_ROUTE}${name}?exp=${expires}&sig=${sig}`;
}

/** Comprueba nombre, firma y caducidad de un enlace. */
export function verifyPhotoLink(
  name: string,
  expires: string | null,
  sig: string | null,
  secret: string,
  now: Date,
): boolean {
  if (!PHOTO_NAME.test(name) || !expires || !sig) return false;
  if (!/^\d+$/.test(expires) || Number(expires) * 1000 <= now.getTime()) {
    return false;
  }
  const expected = Buffer.from(signature(name, Number(expires), secret));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function mimeOf(name: string): string {
  const ext = name.slice(name.lastIndexOf(".") + 1) as PhotoType["ext"];
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

/** Borra las fotos con más días que PHOTO_RETENTION_DAYS. Devuelve cuántas. */
export async function sweepPhotos(dir: string, now: Date): Promise<number> {
  let deleted = 0;
  for (const name of await readdir(dir)) {
    if (!PHOTO_NAME.test(name)) continue;
    const path = join(dir, name);
    const { mtimeMs } = await stat(path);
    if (now.getTime() - mtimeMs > RETENTION_MS) {
      await unlink(path);
      deleted++;
    }
  }
  return deleted;
}

export async function ensurePhotoDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true, mode: 0o700 });
}
