import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

/** Marca de texto por rellenar: `{{PENDIENTE: precio}}`. */
export const PENDIENTE = "{{PENDIENTE";

/** Apariciones de {{PENDIENTE en cualquier fichero de `dir`, como "ruta:línea". */
export async function findPendientes(dir: string): Promise<string[]> {
  const found: string[] = [];
  const files = await readdir(dir, { recursive: true, withFileTypes: true });
  for (const file of files) {
    if (!file.isFile()) continue;
    const full = join(file.parentPath, file.name);
    const content = await readFile(full);
    if (!content.includes(PENDIENTE)) continue;
    const name = relative(dir, full).replace(/\\/g, "/");
    content
      .toString("utf8")
      .split("\n")
      .forEach((line, i) => {
        if (line.includes(PENDIENTE)) found.push(`${name}:${i + 1}`);
      });
  }
  return found.sort();
}
