import type { IncomingMessage } from "node:http";

export class BodyTooLargeError extends Error {}
export class BadBodyError extends Error {}

/**
 * Lee el cuerpo (multipart o urlencoded) como FormData, con un límite de
 * tamaño. Si se pasa, sigue leyendo sin guardar nada (para poder responder sin
 * cortar la conexión al navegador) y lanza BodyTooLargeError. Caddy corta antes
 * los cuerpos desmesurados (deploy/Caddyfile).
 */
export async function readForm(
  req: IncomingMessage,
  maxBytes: number,
): Promise<FormData> {
  const type = req.headers["content-type"] ?? "";
  if (
    !/^multipart\/form-data;/i.test(type) &&
    !/^application\/x-www-form-urlencoded\b/i.test(type)
  ) {
    req.resume();
    throw new BadBodyError(`Content-Type no admitido: ${type || "ninguno"}`);
  }

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req as AsyncIterable<Buffer>) {
    size += chunk.length;
    if (size <= maxBytes) chunks.push(chunk);
  }
  if (size > maxBytes) throw new BodyTooLargeError(`${size} bytes`);

  try {
    return await new Request("http://localhost/", {
      method: "POST",
      headers: { "content-type": type },
      body: Buffer.concat(chunks),
    }).formData();
  } catch (error) {
    throw new BadBodyError(`Cuerpo no válido: ${String(error)}`);
  }
}
