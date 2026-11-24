# DNS y correo de limpiamostuaire.es

Registrador y DNS: **Hostinger** (`hermes.dns-parking.com`, `artemis.dns-parking.com`).
Correo: **Hostinger Email** (buzón `hola@`). Envíos del formulario: **Resend**, desde el subdominio `avisos.`.
VPS: `187.124.51.152` (sin IPv6).

Última revisión: 2026-11-24.

## Zona

### Web

| Nombre | Tipo | Valor | Estado |
|---|---|---|---|
| `@` | A | `187.124.51.152` | ✅ |
| `www` | CNAME | `limpiamostuaire.es.` | ✅ |
| `staging` | A | `187.124.51.152` | ✅ |
| `@` | CAA | `0 issue "letsencrypt.org"` | ⏳ Opcional, recomendado |

El CAA hace que solo Let's Encrypt pueda emitir certificados para el dominio. Si el VPS usa otra CA, hay que cambiar el valor.
Si algún día el VPS tiene IPv6, hay que añadir registros AAAA para `@` y `staging`.

### Correo (Hostinger Email, buzón hola@)

| Nombre | Tipo | Valor | Estado |
|---|---|---|---|
| `@` | MX | `5 mx1.hostinger.com.` | ✅ |
| `@` | MX | `10 mx2.hostinger.com.` | ✅ |
| `@` | TXT | `v=spf1 include:_spf.mail.hostinger.com ~all` | ✅ |
| `hostingermail-a._domainkey` | CNAME | `hostingermail-a.dkim.mail.hostinger.com.` | ✅ Clave activa |
| `hostingermail-b._domainkey` | CNAME | `hostingermail-b.dkim.mail.hostinger.com.` | ✅ Rotación (vacía, es normal) |
| `hostingermail-c._domainkey` | CNAME | `hostingermail-c.dkim.mail.hostinger.com.` | ✅ Rotación (vacía, es normal) |
| `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:dmarc@limpiamostuaire.es; adkim=r; aspf=r; fo=1` | ✅ |

- Solo puede haber **un** TXT que empiece por `v=spf1` en `@`. Resend no se añade aquí, porque envía desde su propio subdominio.
- `dmarc@limpiamostuaire.es` es un **alias de correo** de `hola@`: lo que llega a `dmarc@` acaba en el buzón `hola@`, sin crear otro buzón. Si el alias no existe, los informes DMARC rebotan. Se crea en hPanel → *Correos* → el dominio → *Alias de correo* (o *Reenvíos*).
- Empezamos con `p=none` para recoger informes. Cuando lleven 2–4 semanas sin fallos de SPF/DKIM, pasar a `p=quarantine`.

### Envíos del formulario (Resend, subdominio avisos.)

Dominio `avisos.limpiamostuaire.es` en Resend, región eu-west-1 (Irlanda).

| Nombre | Tipo | Valor | Estado |
|---|---|---|---|
| `send.avisos` | CNAME | `send.forge.rmta.net.` | ✅ |
| `resend._domainkey.avisos` | TXT | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC/PTL8…` (clave de Resend) | ✅ |

- El CNAME de `send.avisos` es el que publica el MX de rebotes (`10 feedback.forge.rmta.net.`) y el SPF de Resend, así que no hay que añadir MX ni TXT aparte.
- En Hostinger, el campo *Nombre* va sin el dominio (`send.avisos`, no `send.avisos.limpiamostuaire.es`).
- Remitente del formulario: `Limpiamos tu aire <formulario@avisos.limpiamostuaire.es>`, con `Reply-To` al correo del cliente y destinatario `hola@limpiamostuaire.es`.
- El `_dmarc` de la raíz cubre también `avisos.`, así que no hace falta otro.

## Comprobaciones

```sh
dig +short limpiamostuaire.es A
dig +short www.limpiamostuaire.es A
dig +short staging.limpiamostuaire.es A
dig +short limpiamostuaire.es CAA
dig +short limpiamostuaire.es MX
dig +short limpiamostuaire.es TXT
dig +short _dmarc.limpiamostuaire.es TXT
dig +short TXT hostingermail-a._domainkey.limpiamostuaire.es
dig +short CNAME send.avisos.limpiamostuaire.es
dig +short TXT resend._domainkey.avisos.limpiamostuaire.es
```

Prueba de envío (hay que ver `SPF: PASS`, `DKIM: PASS` y `DMARC: PASS`):

1. Desde `hola@` (webmail de Hostinger), enviar un correo a una cuenta de Gmail. En Gmail: *⋮ → Mostrar original*.
2. Repetir con un correo enviado por Resend desde `formulario@avisos.limpiamostuaire.es`.
3. Opcional: enviar a la dirección que da [mail-tester.com](https://www.mail-tester.com) y buscar un 10/10.
4. Responder desde Gmail a `hola@` para comprobar que llega.

## Registro de cambios

| Fecha | Cambio |
|---|---|
| 2026-11-24 | Estado inicial: `@` en la página de aparcamiento de Hostinger, DMARC sin `rua`, sin `staging.` ni `avisos.`. |
| 2026-11-24 | `@` y `staging` apuntan al VPS (`187.124.51.152`). DMARC con `rua`. Buzón `hola@` creado. Dominio `avisos.` verificado en Resend. Prueba de envío hecha. |
