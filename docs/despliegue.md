# Despliegue (M1.2)

Cómo llega el sitio al VPS, por qué nada fuera de producción se indexa y qué cabeceras sirve Caddy. El repo ya tiene el código y el workflow; la [puesta en marcha](#puesta-en-marcha-una-vez) son los pasos que se hacen una vez en el VPS y en GitHub.

Es el mismo VPS que rqpbioclean.es (`187.124.51.152`, Hostinger), con el mismo Caddy. Todo lo de esta web va aparte: su fichero en `/etc/caddy/sites/`, su usuario de despliegue y su carpeta en `/srv/`.

## Cómo funciona

| Evento | `SITE_ENV` | Destino en el VPS | URL |
|---|---|---|---|
| Push a un PR (no forks) | `staging` | `/srv/limpiamostuaire/staging/` | `https://staging.limpiamostuaire.es/` (con contraseña) |
| Merge a `main` | variable `SITE_ENV` del repo (`provisional` hasta M5.2, luego `production`) | `/srv/limpiamostuaire/production/` | `https://limpiamostuaire.es/` (`www.` → 301) |

- El job `build` de [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) pasa format, lint, check, tests y build con su `SITE_ENV`, y después `check:robots`, `check:csp`, `check:seo` y `check:caddy`. Guarda `dist/` como artefacto y el job `deploy` lo sube por SSH con `rsync --delete`.
- Staging es uno solo: el último PR que recibe un push lo sobrescribe. GitHub enlaza el despliegue desde el PR.
- `deploy` se salta mientras no exista la variable `DEPLOY_HOST`, así el CI sigue en verde antes de configurar el VPS.
- El CI no despliega [`deploy/Caddyfile`](../deploy/Caddyfile): cuando cambia, se copia a mano ([paso 3](#paso-3--añadir-los-sitios-a-caddy)).
- El endpoint del formulario (`server/`) se despliega en el mismo job, antes que `dist/` ([Endpoint del formulario](#endpoint-del-formulario-m32)).

### Indexación

Dos capas, las dos obligatorias fuera de producción:

1. **Meta robots** (en el HTML): `BaseLayout` añade `<meta name="robots" content="noindex, nofollow">` salvo con `SITE_ENV=production`. Sin variable vale `development`, así que un build olvidado nunca sale indexable. Un valor que no sea `production`, `provisional`, `staging` o `development` hace fallar el build. `npm run check:robots` comprueba `dist/` contra el `SITE_ENV` del build.
2. **Cabecera `X-Robots-Tag: noindex, nofollow`** (en Caddy): la llevan `staging.` siempre y el apex hasta el lanzamiento. Cubre también lo que no es HTML (PDF, imágenes).

No se usa `Disallow` en `robots.txt` para esto: si Google no puede rastrear, no ve el `noindex`. `robots.txt` es el mismo en todos los entornos (permite todo y enlaza el sitemap) y `check:robots` falla si lleva `Disallow` fuera de producción.

`provisional` existe porque el dominio ya apunta al VPS: `main` se publica en el apex desde ya, pero hasta M5.2 la web está a medias y no debe indexarse.

Las páginas de resultado del formulario (`/contacto/enviado/`, `/contacto/error/` y las de `/en/contact/`) llevan `noindex` también en producción y no van al sitemap (`quoteResultPaths` en `src/data/quote-form.ts`); `check:robots` y `check:seo` lo comprueban.

### Qué bloquea el build de producción

Con `SITE_ENV=production` el build falla si hay una página con `draft: true`, un `{{PENDIENTE` en cualquier fichero de `dist/` ([README](../README.md#guardas-de-producción)) o falta `PUBLIC_TURNSTILE_SITE_KEY` (el formulario usaría la clave de pruebas). El CI no llega a desplegar. Con `provisional` no bloquea: hasta M5.2 `main` publica la web a medias.

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
- Lo que no existe → 404 con la página de su idioma (`handle_errors 404`): `/en/…` sirve `en/404.html` y el resto `404.html`. `/404.html` y `/en/404.html` pedidas directamente también dan 404. La 401 de staging no cambia.

`npm run check:caddy` valida el Caddyfile entero y levanta Caddy en local sobre `dist/` para comprobar cabeceras, caché, redirecciones y las 404. Necesita el binario: `caddy` en el `PATH` o `CADDY=/ruta/caddy` (en Arch, `pacman -S caddy`). En el CI se instala solo.

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

## Endpoint del formulario (M3.2)

El formulario de presupuesto (`/contacto/`, `/en/contact/`) envía a `/api/presupuesto/`, que atiende un servicio Node pequeño en el mismo VPS. El código está en [`server/`](../server/) y viene del de rqpbioclean.es: TypeScript que Node 24 ejecuta tal cual, sin dependencias ni build.

| Instancia | Sitio | Puerto (solo local) | Código | Fotos |
|---|---|---|---|---|
| `production` | `limpiamostuaire.es` | `127.0.0.1:4311` | `/srv/limpiamostuaire/api/production/` | `/var/lib/limpiamostuaire-api/production/` |
| `staging` | `staging.limpiamostuaire.es` | `127.0.0.1:4312` | `/srv/limpiamostuaire/api/staging/` | `/var/lib/limpiamostuaire-api/staging/` |

rqpbioclean.es usa los puertos 4301 y 4302 en el mismo VPS: no se tocan.

- Caddy pasa `/api/presupuesto/*` al puerto de cada sitio (snippet `lta_api` de [`deploy/Caddyfile`](../deploy/Caddyfile)). En staging, la contraseña también protege la API y los enlaces de las fotos.
- Cada instancia es `limpiamostuaire-api@<instancia>.service` ([`deploy/systemd/`](../deploy/systemd/)), con un usuario efímero sin privilegios. Lee los secretos de `/etc/limpiamostuaire/api-<instancia>.env` (solo root) y guarda las fotos en su carpeta de `/var/lib`, fuera de lo que sirve Caddy.
- El job `deploy` sube el endpoint antes que `dist/` y deja para el final el fichero `REVISION` (el commit). Al cambiar, `limpiamostuaire-api-restart@<instancia>.path` reinicia el servicio: `ltadeploy` solo puede hacer rsync, no `systemctl`. Antes, el job `build` arranca el paquete y comprueba que responde.
- Las fotos se borran a los 30 días (lo que dice la política de privacidad): el servicio hace el barrido al arrancar y cada hora. Los enlaces firmados del email caducan a la vez.
- Los emails salen por Resend desde `formulario@avisos.limpiamostuaire.es` ([`dns.md`](dns.md)), a `hola@` con `Reply-To` al cliente. Asunto: `Presupuesto · <municipio> · <n.º> splits`. Si el cliente deja email, le llega un acuse en el idioma del formulario.
- Sin token de Turnstile (sin JS no hay), el envío se rechaza y el navegador va a la página de error, que ofrece teléfono y WhatsApp.
- Los logs (`journalctl`) no llevan datos personales: solo el id de cada solicitud y qué ha pasado.

En local: `npm run dev:api` y `npm run dev` a la vez; `astro dev` pasa `/api/` al servicio. Sin `RESEND_API_KEY`, los emails se escriben en la consola, y Turnstile usa las claves de pruebas de Cloudflare (siempre pasan). Variables: [`.env.example`](../.env.example).

### Puesta en marcha (una vez)

Mismas convenciones que arriba (`$` tu máquina, `vps#` el VPS como root). Haz los pasos A–E antes de subir el PR que trae el endpoint: si falta `/srv/limpiamostuaire/api/`, el job `deploy` falla y staging no se actualiza.

#### A · Node 24 en el VPS

rqpbioclean.es ya lo instaló para su endpoint:

```sh
vps# node --version     # v24 o superior
vps# command -v node    # /usr/bin/node: es la ruta del ExecStart
```

#### B · Clave de Resend

El dominio `avisos.limpiamostuaire.es` ya está verificado ([`dns.md`](dns.md)). En Resend → API Keys → Create: permiso **Sending access**, limitado al dominio `avisos.limpiamostuaire.es` (no reutilices la de rqp). Guárdala en el gestor de contraseñas.

#### C · Widget de Turnstile en Cloudflare

En el panel de Cloudflare (no hace falta que el dominio esté en Cloudflare) → Turnstile → Add widget:

- Nombre: `limpiamostuaire.es`. Hostnames: `limpiamostuaire.es` y `staging.limpiamostuaire.es`.
- Modo: **Managed**. Sin pre-clearance.

Copia la clave del sitio (pública) y la secreta.

#### D · Directorios y secretos

```sh
vps# install -d -o ltadeploy -g ltadeploy -m 755 /srv/limpiamostuaire/api
vps# install -d -m 700 /etc/limpiamostuaire
vps# install -m 600 /dev/null /etc/limpiamostuaire/api-production.env
vps# install -m 600 /dev/null /etc/limpiamostuaire/api-staging.env
vps# openssl rand -base64 48     # una vez para cada fichero: PHOTO_SIGNING_SECRET
vps# nano /etc/limpiamostuaire/api-production.env
```

```ini
PORT=4311
PUBLIC_URL=https://limpiamostuaire.es
PHOTO_SIGNING_SECRET=<openssl rand -base64 48>
TURNSTILE_SECRET_KEY=<clave secreta del widget>
RESEND_API_KEY=re_…
MAIL_FROM="Limpiamos tu aire <formulario@avisos.limpiamostuaire.es>"
MAIL_TO=hola@limpiamostuaire.es
```

`MAIL_TO` admite varias direcciones separadas por comas: todas reciben la solicitud, y el acuse al cliente lleva todas en «Responder a».

`/etc/limpiamostuaire/api-staging.env`, completo (el servicio no lee el de producción). `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY` y `MAIL_FROM` son los mismos; el resto cambia:

```ini
PORT=4312
PUBLIC_URL=https://staging.limpiamostuaire.es
PHOTO_SIGNING_SECRET=<otro distinto: openssl rand -base64 48>
TURNSTILE_SECRET_KEY=<la misma que en producción>
RESEND_API_KEY=<la misma que en producción>
MAIL_FROM="Limpiamos tu aire <formulario@avisos.limpiamostuaire.es>"
MAIL_TO=<tu email>
MAIL_SUBJECT_PREFIX="[staging] "
```

En staging, el acuse le llega al email que se escriba en el formulario: prueba con direcciones tuyas. Cambiar `PHOTO_SIGNING_SECRET` invalida los enlaces de fotos ya enviados.

#### E · Unidades de systemd

```sh
$ scp deploy/systemd/limpiamostuaire-api* root@187.124.51.152:/etc/systemd/system/
vps# systemctl daemon-reload
vps# systemctl enable --now limpiamostuaire-api-restart@production.path limpiamostuaire-api-restart@staging.path
vps# systemctl enable limpiamostuaire-api@production limpiamostuaire-api@staging
```

Los servicios se quedan sin arrancar: aún no hay código. Los arranca el primer despliegue (el `.path` ve `REVISION`).

#### F · Caddy y GitHub

- Actualiza el Caddyfile en el VPS con el procedimiento de «Cuando cambie `deploy/Caddyfile`» ([paso 3](#paso-3--añadir-los-sitios-a-caddy)). Hasta que arranquen los servicios, `/api/presupuesto/` da 502; el resto del sitio, igual que antes.
- La clave pública del widget, como variable del repo (va en el HTML, no es secreta):

```sh
$ gh variable set TURNSTILE_SITE_KEY --body <clave del sitio>
```

Sin ella, el build usa la clave de pruebas: el formulario se ve, pero el endpoint rechaza sus tokens. El build de producción (`SITE_ENV=production`) falla sin ella.

#### G · Primer despliegue y prueba de punta a punta

Push al PR → CI despliega staging. En el VPS:

```sh
vps# cat /srv/limpiamostuaire/api/staging/REVISION                  # el commit del PR
vps# systemctl status limpiamostuaire-api@staging --no-pager        # active (running)
vps# journalctl -u limpiamostuaire-api@staging -n 20 --no-pager     # "limpiamostuaire-api en http://127.0.0.1:4312/…"
vps# curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4312/api/presupuesto/   # 405
```

```sh
$ curl -s -o /dev/null -w '%{http_code}\n' -u lta:<contraseña> https://staging.limpiamostuaire.es/api/presupuesto/   # 405
$ curl -s -u lta:<contraseña> -H 'Accept: application/json' -F nombre=Prueba -F telefono=612345678 \
    -F municipio=Polop -F tipo=casa -F splits=1 -F privacidad=si https://staging.limpiamostuaire.es/api/presupuesto/
#   {"ok":false,"error":"turnstile"}: sin token no pasa
```

Si el servicio no arranca, `journalctl` dice qué variable falta. Si `REVISION` cambió y no se reinició: `systemctl status limpiamostuaire-api-restart@staging.path`.

Después, desde el móvil, en `/contacto/` y `/en/contact/` de staging:

- [ ] El botón de fotos y su estado («Ninguna foto elegida», «2 fotos elegidas») salen en el idioma de la página, también con el navegador en otro idioma.
- [ ] Envío con 2 fotos y email → página «enviada» en el idioma.
- [ ] Email en `MAIL_TO`: asunto `[staging] Presupuesto · <municipio> · <n.º> splits`, datos ordenados, enlaces de las fotos que abren (piden la contraseña de staging).
- [ ] Acuse en el idioma del formulario en el email escrito.
- [ ] Desde `/negocios/`, el enlace al formulario llega con «En un negocio» marcado y el email dice «Enviado desde …/negocios/».
- [ ] Con JS desactivado: se ve el aviso y, al enviar, la página de error.
- [ ] DevTools → Console: sin errores de CSP con el widget de Turnstile.
- [ ] DevTools → Application: Turnstile no deja cookies ni almacenamiento en `staging.limpiamostuaire.es` (si los deja, revisar la política de cookies).
- [ ] Caducidad: `touch -d '31 days ago' /var/lib/limpiamostuaire-api/staging/<una foto>`, `systemctl restart limpiamostuaire-api@staging` y la foto ya no está.

#### H · Producción (con el merge)

Producción no se arranca a mano: la arranca el despliegue de `main`, igual que el primer push arrancó staging. Antes del merge, en el VPS:

```sh
vps# grep -oE '^[A-Z_]+=' /etc/limpiamostuaire/api-production.env      # las 7 variables de D, sin valores
vps# systemctl is-enabled limpiamostuaire-api@production                # enabled
vps# systemctl is-active limpiamostuaire-api-restart@production.path    # active
```

Merge → CI despliega `main` → `REVISION` de producción cambia → arranca el servicio. Después:

```sh
vps# cat /srv/limpiamostuaire/api/production/REVISION               # el commit del merge
vps# systemctl status limpiamostuaire-api@production --no-pager     # active (running)
vps# curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4311/api/presupuesto/   # 405
```

Luego, un envío real desde `limpiamostuaire.es/contacto/`, que llega a `hola@`.

## Lanzamiento (M5.2)

Lo que cambia para que el apex sea indexable, en este orden:

1. `gh variable set SITE_ENV --body production` y un push a `main` (o el merge del PR de M5.2). Comprobar `curl -s https://limpiamostuaire.es/ | grep -c '<meta name="robots"'` → `0`.
2. En [`deploy/Caddyfile`](../deploy/Caddyfile), quitar la línea `X-Robots-Tag` del bloque `limpiamostuaire.es` (la de staging se queda) y copiarlo al VPS ([paso 3](#paso-3--añadir-los-sitios-a-caddy)).
3. `curl -sI https://limpiamostuaire.es/ | grep -ic x-robots-tag` → `0`; `staging.` sigue dando 401.
