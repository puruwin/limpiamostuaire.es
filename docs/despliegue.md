# Despliegue (M1.2)

Cómo llega el sitio al VPS, por qué nada fuera de producción se indexa y qué cabeceras sirve Caddy. El repo ya tiene el código y el workflow; la [puesta en marcha](#puesta-en-marcha-una-vez) son los pasos que se hacen una vez en el VPS y en GitHub.

Es el mismo VPS que rqpbioclean.es (`187.124.51.152`, Hostinger), con el mismo Caddy. Todo lo de esta web va aparte: su fichero en `/etc/caddy/sites/`, su usuario de despliegue y su carpeta en `/srv/`.

## Cómo funciona

| Evento | `SITE_ENV` | Destino en el VPS | URL |
|---|---|---|---|
| Push a un PR (no forks) | `staging` | `/srv/limpiamostuaire/staging/` | `https://staging.limpiamostuaire.es/` (con contraseña) |
| Merge a `main` | variable `SITE_ENV` del repo (`provisional` hasta M5.2, luego `production`) | `/srv/limpiamostuaire/production/` | `https://limpiamostuaire.es/` (`www.` → 301) |

- El job `build` de [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) pasa format, lint, check, tests y build con su `SITE_ENV`, y después `check:robots`, `check:csp` y `check:caddy`. Guarda `dist/` como artefacto y el job `deploy` lo sube por SSH con `rsync --delete`.
- Staging es uno solo: el último PR que recibe un push lo sobrescribe. GitHub enlaza el despliegue desde el PR.
- `deploy` se salta mientras no exista la variable `DEPLOY_HOST`, así el CI sigue en verde antes de configurar el VPS.
- El CI no despliega [`deploy/Caddyfile`](../deploy/Caddyfile): cuando cambia, se copia a mano ([paso 3](#paso-3--añadir-los-sitios-a-caddy)).

### Indexación

Dos capas, las dos obligatorias fuera de producción:

1. **Meta robots** (en el HTML): `BaseLayout` añade `<meta name="robots" content="noindex, nofollow">` salvo con `SITE_ENV=production`. Sin variable vale `development`, así que un build olvidado nunca sale indexable. Un valor que no sea `production`, `provisional`, `staging` o `development` hace fallar el build. `npm run check:robots` comprueba `dist/` contra el `SITE_ENV` del build.
2. **Cabecera `X-Robots-Tag: noindex, nofollow`** (en Caddy): la llevan `staging.` siempre y el apex hasta el lanzamiento. Cubre también lo que no es HTML (PDF, imágenes).

No se usa `Disallow` en `robots.txt` para esto: si Google no puede rastrear, no ve el `noindex`.

`provisional` existe porque el dominio ya apunta al VPS: `main` se publica en el apex desde ya, pero hasta M5.2 la web está a medias y no debe indexarse.

### Cabeceras y CSP

En todas las respuestas (snippet `lta_headers` de [`deploy/Caddyfile`](../deploy/Caddyfile)), también en las 401 de staging y en las redirecciones:

| Cabecera | Valor |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | cámara, micrófono, ubicación, pagos, USB, sensores y Topics desactivados |
| `Content-Security-Policy` | `frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Server` | se quita, salvo en las respuestas de error (404, 401) |

`includeSubDomains` obliga a HTTPS en todos los subdominios. Hoy solo `www.` y `staging.` sirven web (los dos con certificado); `avisos.` es solo de correo y no le afecta. Un subdominio web nuevo tiene que nacer con HTTPS.

La CSP va en dos partes, que el navegador aplica a la vez:

- **En cada página**, un `<meta http-equiv="content-security-policy">` que genera Astro (`security.csp` en [`astro.config.mjs`](../astro.config.mjs)): `default-src 'self'` y `script-src`/`style-src` con el hash de cada `<script>` y `<style>` inline, sin `'unsafe-inline'`. Ya permite Umami Cloud (`cloud.umami.is`, M3.3) y Turnstile (`challenges.cloudflare.com`, M3.2). Va en el HTML porque los hashes cambian con cada build y Caddy no los conoce.
- **En la cabecera**, lo que un `<meta>` no puede llevar (`frame-ancestors`) y lo que no depende de la página.

`npm run check:csp` falla si una página no tiene su `<meta>`, si `script-src` lleva `'unsafe-inline'` o `'unsafe-eval'`, si algún `<script>` o `<style>` inline no tiene su hash, o si aparece un atributo `style=""` u `on…=""` (la CSP los bloquea sin avisar). Un dominio externo nuevo (un mapa, un vídeo) se añade en `security.csp` de `astro.config.mjs`.

### Caché y redirecciones

- `/_astro/*` (CSS, JS, fuentes e imágenes con hash en el nombre): `Cache-Control: public, max-age=31536000, immutable`. El HTML no lleva `Cache-Control`; Caddy manda `ETag` y `Last-Modified` y el navegador revalida.
- `/index.html` y `/<ruta>/index.html` → `/<ruta>/` con 301.
- Sin barra final → con barra, 301 (`trailingSlash: 'always'` de Astro).
- `www.limpiamostuaire.es/<ruta>` → `https://limpiamostuaire.es/<ruta>` con 301.
- `http://` → `https://`: lo hace Caddy solo (308).

`npm run check:caddy` valida el Caddyfile entero y levanta Caddy en local sobre `dist/` para comprobar cabeceras, caché y redirecciones. Necesita el binario: `caddy` en el `PATH` o `CADDY=/ruta/caddy` (en Arch, `pacman -S caddy`). En el CI se instala solo.

## Puesta en marcha (una vez)

Convenciones: `$` es tu máquina, `vps#` es el VPS como root. Cada paso termina con una comprobación; no sigas si falla. Los pasos no tocan rqpbioclean.es: su fichero de `sites/` se queda igual y Caddy se recarga (`reload`) sin reiniciar.

El DNS ya está ([`dns.md`](dns.md)): `@` y `staging` → VPS, `www` → CNAME al apex, CAA solo para Let's Encrypt.

```sh
$ dig +short limpiamostuaire.es A; dig +short www.limpiamostuaire.es A; dig +short staging.limpiamostuaire.es A
#   187.124.51.152 las tres veces
```

### Paso 0 · Copia

```sh
vps# caddy version                                   # ≥ 2.8
vps# grep -nE 'import +(/etc/caddy/)?sites/\*\.caddy' /etc/caddy/Caddyfile   # el import que puso rqp
vps# cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak-$(date +%F)
vps# command -v rrsync                               # /usr/bin/rrsync
```

### Paso 1 · Usuario y directorios

```sh
vps# adduser --disabled-password --gecos "" ltadeploy
vps# install -d -o ltadeploy -g ltadeploy -m 755 /srv/limpiamostuaire /srv/limpiamostuaire/production /srv/limpiamostuaire/staging
vps# sudo -u caddy ls /srv/limpiamostuaire/production   # sin error: Caddy puede leer
```

`ltadeploy` no tiene contraseña ni sudo: solo entra con la clave del paso 4, restringida a rsync dentro de `/srv/limpiamostuaire`. Es otro usuario que `rqpdeploy` a propósito: una clave filtrada de una web no puede escribir en la otra.

### Paso 2 · Contraseña de staging

```sh
vps# caddy hash-password                 # pide la contraseña dos veces; copia el hash ($2a$14$…)
vps# install -m 640 -o root -g caddy /dev/null /etc/caddy/limpiamostuaire-staging.auth
vps# nano /etc/caddy/limpiamostuaire-staging.auth
```

Una sola línea, usuario y hash separados por un espacio, sin comillas:

```text
lta $2a$14$…
```

Si el fichero no existe, la validación del paso 3 falla con `File to import not found`: staging nunca queda abierto por olvido. Guarda usuario y contraseña en el gestor de contraseñas.

### Paso 3 · Añadir los sitios a Caddy

```sh
$ scp deploy/Caddyfile root@187.124.51.152:/tmp/limpiamostuaire.caddy
vps# mv /tmp/limpiamostuaire.caddy /etc/caddy/sites/limpiamostuaire.caddy
vps# caddy validate --adapter caddyfile --config /etc/caddy/Caddyfile    # "Valid configuration"
vps# systemctl reload caddy
vps# journalctl -u caddy -n 50 --no-pager | grep -iE 'error|certificate obtained'
```

Comprobar que rqp sigue igual y que los sitios nuevos responden (aún vacíos, así que 404):

```sh
$ curl -sI https://rqpbioclean.es/ | head -1                                           # HTTP/2 200
$ curl -sI https://limpiamostuaire.es/ | grep -iE '^HTTP|x-robots-tag|strict-transport'  # 404 · noindex · HSTS
$ curl -sI https://www.limpiamostuaire.es/x/ | grep -iE '^HTTP|^location'               # 301 · https://limpiamostuaire.es/x/
$ curl -sI https://staging.limpiamostuaire.es/ | head -1                                # HTTP/2 401
```

**Si algo va mal:** `rm /etc/caddy/sites/limpiamostuaire.caddy && systemctl reload caddy` deja Caddy como estaba. Un `validate` fallido no toca nada de lo que está sirviendo. Si `curl` da error de certificado, mira `journalctl -u caddy -f`: Caddy reintenta solo.

**Cuando cambie `deploy/Caddyfile`:** `cp /etc/caddy/sites/limpiamostuaire.caddy /etc/caddy/sites/limpiamostuaire.caddy.bak-$(date +%F)`, repite el `scp` y el `mv`, `caddy validate` y `systemctl reload caddy`.

### Paso 4 · Clave de despliegue

Una clave nueva solo para GitHub Actions, sin passphrase:

```sh
$ ssh-keygen -t ed25519 -N "" -C "github-actions limpiamostuaire" -f ~/lta-deploy
$ cat ~/lta-deploy.pub
```

En el VPS:

```sh
vps# install -d -o ltadeploy -g ltadeploy -m 700 /home/ltadeploy/.ssh
vps# nano /home/ltadeploy/.ssh/authorized_keys
```

Una sola línea (pega tu `.pub` detrás de `restrict `):

```text
command="/usr/bin/rrsync /srv/limpiamostuaire",restrict ssh-ed25519 AAAA… github-actions limpiamostuaire
```

```sh
vps# chown ltadeploy:ltadeploy /home/ltadeploy/.ssh/authorized_keys && chmod 600 /home/ltadeploy/.ssh/authorized_keys
vps# ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub   # apunta la huella (SHA256:…)
```

Prueba desde tu máquina con un build real de staging:

```sh
$ ssh -i ~/lta-deploy ltadeploy@187.124.51.152           # debe rechazar la shell (rrsync): bien
$ SITE_ENV=staging npm run build
$ rsync -rtz --chmod=D755,F644 --delete -e "ssh -i ~/lta-deploy" dist/ ltadeploy@187.124.51.152:staging/
$ curl -s -u lta:<contraseña> https://staging.limpiamostuaire.es/ | grep -o '<meta name="robots"[^>]*>'
#   <meta name="robots" content="noindex, nofollow">
```

### Paso 5 · Secrets y variables en GitHub

```sh
$ ssh-keyscan -t ed25519 187.124.51.152 > /tmp/lta-known-hosts
$ ssh-keygen -lf /tmp/lta-known-hosts         # misma huella que en el paso 4; si no, no sigas
$ gh secret set DEPLOY_KNOWN_HOSTS < /tmp/lta-known-hosts
$ gh secret set DEPLOY_SSH_KEY < ~/lta-deploy
$ gh variable set SITE_ENV --body provisional
$ gh variable set DEPLOY_HOST --body 187.124.51.152   # el último: activa el job deploy
```

`DEPLOY_USER` no hace falta (por defecto `ltadeploy`). Los entornos `staging` y `production` se crean solos en el primer despliegue; en Settings → Environments → `production` conviene limitarlo a la rama `main`.

### Paso 6 · Primer despliegue por CI

Un push a un PR abierto despliega staging. Las variables se leen al arrancar el workflow: relanzar un run antiguo no sirve.

```sh
$ git commit --allow-empty -m "Probar despliegue" && git push
$ gh run watch
```

Si `deploy` falla en «Subir dist/ al VPS», casi siempre es la clave o `known_hosts`: repite la prueba de rsync del paso 4.

```sh
$ curl -sI -u lta:<contraseña> https://staging.limpiamostuaire.es/ | grep -iE '^HTTP|x-robots-tag'   # 200 · noindex
$ curl -sI -u lta:<contraseña> https://staging.limpiamostuaire.es/index.html | grep -iE '^HTTP|^location'   # 301 · /
$ curl -sI -u lta:<contraseña> https://staging.limpiamostuaire.es/en | grep -iE '^HTTP|^location'           # 301 · /en/
$ curl -sI -u lta:<contraseña> "https://staging.limpiamostuaire.es$(curl -s -u lta:<contraseña> https://staging.limpiamostuaire.es/ | grep -o '/_astro/[^"]*' | head -1)" | grep -i cache-control
#   cache-control: public, max-age=31536000, immutable
```

En [securityheaders.com](https://securityheaders.com/?q=staging.limpiamostuaire.es&followRedirects=on): **A+** (puntúa la respuesta 401, que lleva las mismas cabeceras). Si avisa de `'unsafe-inline'` en `style-src`, no baja la nota; en `script-src` sí, y `check:csp` no debería dejarlo pasar.

Con la contraseña puesta, en el navegador: DevTools → Console sin errores de CSP en `/` y `/en/`.

Tras el merge a `main`:

```sh
$ curl -sI https://limpiamostuaire.es/ | grep -iE '^HTTP|x-robots-tag'          # 200 · noindex
$ curl -s https://limpiamostuaire.es/ | grep -o '<meta name="robots"[^>]*>'     # noindex, nofollow
```

### Paso 7 · Cerrar

- Guarda `~/lta-deploy` en el gestor de contraseñas y bórralo del disco (`shred -u ~/lta-deploy`). Para rotarla: clave nueva, línea nueva en `authorized_keys`, `gh secret set DEPLOY_SSH_KEY` y borrar la línea vieja.
- `rm /tmp/lta-known-hosts`.

## Lanzamiento (M5.2)

Lo que cambia para que el apex sea indexable, en este orden:

1. `gh variable set SITE_ENV --body production` y un push a `main` (o el merge del PR de M5.2). Comprobar `curl -s https://limpiamostuaire.es/ | grep -c '<meta name="robots"'` → `0`.
2. En [`deploy/Caddyfile`](../deploy/Caddyfile), quitar la línea `X-Robots-Tag` del bloque `limpiamostuaire.es` (la de staging se queda) y copiarlo al VPS ([paso 3](#paso-3--añadir-los-sitios-a-caddy)).
3. `curl -sI https://limpiamostuaire.es/ | grep -ic x-robots-tag` → `0`; `staging.` sigue dando 401.
