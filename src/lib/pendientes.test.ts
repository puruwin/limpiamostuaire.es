import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { findPendientes } from "./pendientes.ts";

test("encuentra {{PENDIENTE en cualquier fichero y subcarpeta, con línea", async () => {
  const dir = await mkdtemp(join(tmpdir(), "pendientes-"));
  try {
    await mkdir(join(dir, "en/prices"), { recursive: true });
    await writeFile(join(dir, "index.html"), "<p>ok</p>\n");
    await writeFile(
      join(dir, "en/prices/index.html"),
      "<p>\n{{PENDIENTE: precio}}</p>\n",
    );
    await writeFile(join(dir, "sitemap.xml"), "{{PENDIENTE}}");
    await writeFile(
      join(dir, "logo.png"),
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0xff]),
    );
    assert.deepEqual(await findPendientes(dir), [
      "en/prices/index.html:2",
      "sitemap.xml:1",
    ]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("sin marcas, lista vacía", async () => {
  const dir = await mkdtemp(join(tmpdir(), "pendientes-"));
  try {
    await writeFile(join(dir, "index.html"), "<p>PENDIENTE sin llaves</p>");
    assert.deepEqual(await findPendientes(dir), []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
