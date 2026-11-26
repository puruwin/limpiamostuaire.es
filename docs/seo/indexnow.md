# IndexNow (M1.7)

[IndexNow](https://www.indexnow.org/) avisa a los buscadores de que una URL es nueva o ha cambiado, sin esperar a que la rastreen. Lo usan Bing (y con él Copilot, que se alimenta del índice de Bing), Yandex, Seznam y Naver. Un solo envío a `api.indexnow.org` llega a todos. Google no lo usa: para Google están el sitemap y Search Console (M5.2).

## Clave

| | |
|---|---|
| Clave | `cb7fb6c0428e2915a9da45321d64d381` |
| Fichero | [`public/cb7fb6c0428e2915a9da45321d64d381.txt`](../../public/cb7fb6c0428e2915a9da45321d64d381.txt) (solo la clave) |
| `keyLocation` | `https://limpiamostuaire.es/cb7fb6c0428e2915a9da45321d64d381.txt` |

La clave es pública a propósito: el buscador descarga el fichero y comprueba que su contenido coincide con la clave del envío. Así sabe que quien envía controla el dominio. No es un secreto, pero tampoco se cambia sin motivo. Si se cambia, el fichero nuevo tiene que estar publicado antes del primer envío con la clave nueva.

```sh
$ curl -s https://limpiamostuaire.es/cb7fb6c0428e2915a9da45321d64d381.txt   # la clave, sin salto de línea
```

## Cuándo enviar

- **Nunca antes del lanzamiento (M5.2).** Hasta entonces el apex lleva `noindex` y enviar URLs no sirve de nada.
- En el lanzamiento, todas las URLs del sitemap, una vez.
- Después, solo las URLs nuevas o con cambios de contenido (las que cambian su `updated`), cuando estén ya en producción. Reenviar URLs sin cambios no ayuda y puede acabar en 429.

## Comando

Todas las URLs del sitemap de producción (necesita `curl` y `jq`):

```sh
KEY=cb7fb6c0428e2915a9da45321d64d381
curl -fsS https://limpiamostuaire.es/sitemap.xml \
  | grep -o '<loc>[^<]*</loc>' | sed -e 's/<loc>//' -e 's/<\/loc>//' \
  | jq -R . | jq -s --arg key "$KEY" '{
      host: "limpiamostuaire.es",
      key: $key,
      keyLocation: "https://limpiamostuaire.es/\($key).txt",
      urlList: .
    }' \
  | curl -sS -X POST https://api.indexnow.org/indexnow \
      -H 'Content-Type: application/json; charset=utf-8' \
      --data-binary @- -o /dev/null -w '%{http_code}\n'
```

Una sola URL:

```sh
curl -sS -o /dev/null -w '%{http_code}\n' \
  "https://api.indexnow.org/indexnow?url=https://limpiamostuaire.es/precios/&key=cb7fb6c0428e2915a9da45321d64d381"
```

Para varias URLs concretas, sustituye el `curl … sitemap.xml | grep | sed` del primer comando por `printf '%s\n' https://limpiamostuaire.es/precios/ https://limpiamostuaire.es/en/prices/`.

## Respuestas

| Código | Qué significa |
|---|---|
| `200` | Recibido y clave validada. |
| `202` | Recibido; la clave se validará después. Normal en el primer envío. |
| `400` | Petición mal formada (JSON o parámetros). |
| `403` | Clave no válida: el fichero no está publicado o no coincide. Comprueba el `curl` de la clave. |
| `422` | Alguna URL no es de `host`, o la clave no corresponde al dominio. |
| `429` | Demasiados envíos: parece spam. Espera y envía solo lo que haya cambiado. |

Los envíos aparecen después en Bing Webmaster Tools, en *IndexNow* (cuando la web esté dada de alta allí, M5.2).
