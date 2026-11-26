# Palabras clave y SERP (M0.5)

Objetivo: validar con datos qué se busca antes de escribir los títulos (M2) y asignar cada búsqueda a una página.

Estado: **cerrado el 25-11-2026**.

## 1. Keyword Planner

### Cómo sacarlo

1. Google Ads → *Herramientas* → *Planificador de palabras clave* → **Obtener el volumen de búsquedas y previsiones**.
2. Pegar la lista ES (abajo). Ubicación: **Provincia de Alicante**. Idioma: **español**. Red: Google. Periodo: **últimos 12 meses** (importa la estacionalidad: el pico debería caer en mayo–julio).
3. Descargar el CSV (*Descargar ideas de palabras clave* → .csv).
4. Repetir con la ubicación **España** (para palabras sin municipio, que en Alicante darán «0–10»).
5. Repetir con la lista EN: ubicación **Provincia de Alicante**, idioma **inglés**.
6. Opcional: *Descubre nuevas palabras clave* con las 5 primeras semillas ES, ubicación Alicante, para encontrar variantes que no hemos pensado. Exportar también.

Sin una campaña activa, Keyword Planner da rangos (10–100, 100–1000). Para decidir nos basta.

Archivos: `docs/seo/datos/kp_{alicante,spain}_{es,en}.csv` y `kp_ideas.csv` (UTF-16, periodo nov-2025 a oct-2026). La cuenta tiene inversión, así que las cifras son exactas y no rangos. Los volúmenes no dependen de las campañas de la cuenta.

### Lista ES (pegar tal cual)

```
limpieza aire acondicionado
limpieza de aire acondicionado
limpiar aire acondicionado
limpieza split
limpieza split aire acondicionado
limpieza profunda aire acondicionado
limpieza aire acondicionado a domicilio
limpieza aire acondicionado precio
precio limpieza aire acondicionado
cuanto cuesta limpiar aire acondicionado
mantenimiento aire acondicionado
mantenimiento aire acondicionado precio
limpieza aire acondicionado benidorm
limpieza split benidorm
mantenimiento aire acondicionado benidorm
aire acondicionado benidorm
limpieza aire acondicionado finestrat
limpieza aire acondicionado villajoyosa
limpieza aire acondicionado la vila joiosa
limpieza aire acondicionado la nucia
limpieza aire acondicionado polop
limpieza aire acondicionado callosa d'en sarria
limpieza aire acondicionado calpe
limpieza aire acondicionado calp
limpieza aire acondicionado altea
mantenimiento aire acondicionado altea
mantenimiento aire acondicionado calpe
mantenimiento aire acondicionado villajoyosa
limpieza aire acondicionado oficinas
limpieza aire acondicionado restaurante
limpieza aire acondicionado local comercial
limpieza aire acondicionado hotel
limpieza aire acondicionado apartamento turistico
mantenimiento aire acondicionado empresas
aire acondicionado huele mal
aire acondicionado huele a humedad
aire acondicionado huele a moho
aire acondicionado gotea
split gotea agua
aire acondicionado no enfria
aire acondicionado moho
limpiar filtros aire acondicionado
cada cuanto limpiar aire acondicionado
limpieza conductos aire acondicionado
limpieza conductos aire acondicionado precio
limpieza conductos benidorm
limpieza aire acondicionado conductos
```

### Lista EN (pegar tal cual)

```
air conditioning cleaning benidorm
aircon cleaning benidorm
air con cleaning benidorm
ac cleaning benidorm
air conditioning service benidorm
air conditioning benidorm
aircon service benidorm
air conditioning cleaning altea
air conditioning cleaning calpe
aircon cleaning altea
aircon cleaning calpe
air conditioning cleaning spain
aircon cleaning spain
air conditioning cleaning costa blanca
aircon smells bad
air conditioner smells musty
air conditioner leaking water
air conditioning duct cleaning
```

## 2. SERP manual (10 búsquedas)

### Cómo hacerla

- Desde Benidorm (o con el móvil estando en la zona), en una ventana de **incógnito** y sin iniciar sesión.
- Hecho el 25-11-2026 desde Benidorm (ubicación por IP). Las capturas en PDF se quedan fuera del repo; aquí solo va la tabla resumen.
- **Mapa**: los 3 del paquete local (nombre · nota · nº de reseñas · ¿tiene web?).
- **Orgánico**: los 5 primeros dominios y de qué tipo son: *competidor*, *directorio* (Habitissimo, Cronoshare, Páginas Amarillas…), *fabricante/blog* o *otro*.
- **Extras**: ¿anuncios arriba? ¿resumen de IA? ¿«Otras preguntas de los usuarios» (copiar 2 o 3)?


### Resultado

Leyenda: **[C]** competidor directo de limpieza · [cl] empresa de climatización (instala/repara) · [d] directorio · [i] informativo (fabricante, tienda, blog).

| # | Búsqueda | Mapa (top 4) | Orgánico (top 5) | Extras |
|---|---|---|---|---|
| 01 | limpieza aire acondicionado benidorm | Climaled 4,9 (550) · Serviaire 4,3 (57) · Tecnivent 4,9 (249) · Más que Clima 4,9 (78) | **[C] Clining** (limpiezaapartamentos.es, 85 €) · [cl] Airecomfort · [d] HomeServe · [cl] Climalgar · [cl] Climática (Tecnivent) | Anuncio: climamed.es. PAA: «¿Cuánto se cobra por la limpieza…?», «¿Cómo saber si mi aire necesita limpieza?». También [C] buenaire.pro, beniclima (60 €), [C] clean-airco, [d] ProntoPro |
| 02 | limpieza aire acondicionado *(desde Benidorm)* | Climaled · Tecnivent · Serviaire · Benimestic 4,6 (220) | Shopping (kits) · vídeos · [i] Leroy Merlin · [i] Polti · [i] Endesa, Bosch, Hitachi, Samsung | 2 anuncios (climagadea, climamed). Intención mixta: casi todo es DIY |
| 03 | limpieza split benidorm | Climaled · Tecnivent · **[C] Clining 4,9 (31)** · Serviaire | **[C] Clining** · [cl] Airecomfort · **[C] buenaire.pro** · [cl] Climalgar · [C] clean-airco | **Resumen de IA**: «entre 59 € y 90 €», cita a Clining y BuenAire. Tecnimoles «desde 59 € IVA inc.», Benimestic 220 €/año + IVA |
| 04 | mantenimiento aire acondicionado benidorm | Climaled · Serviaire · Tecnivent · Noé.A 5,0 (8) | [d] HomeServe · [cl] Beniclima · [cl] Climalgar · [cl] Airecomfort · [cl] Benimestic | [d] Trustlocal, Habitissimo, Wallapop. Clining aparece en 8.º |
| 05 | precio limpieza aire acondicionado | — (sin mapa) | [d] Cronoshare (50–80 €) · **[C] Clining** · [i] WIP (conductos) · Climamed · blogs de Sevilla/Barcelona/Valencia (60–100 €) | 2 anuncios. Nadie de la zona con una tabla de precios clara |
| 06 | limpieza aire acondicionado altea | Reliable Clima 4,9 (219) · Climaltea 4,9 (54) · Servi-Sol 5,0 (6) · Tot Clean 5,0 (16) | [cl] Tecnimoles (página de Altea) · [C] clean-airco (página de Altea) · [cl] Expert Altea · [cl] The Acmen · [cl] Climalgar (página de Altea) | Resumen de IA con 6 empresas. **Clining sale en 6.º con su página de Benidorm** |
| 07 | limpieza aire acondicionado calpe | K&M Air Con 4,9 (107) · AC Instalaciones 4,8 (22) · AirCon Ninjas 5,0 (16) · Instalaciones Calpe 5,0 (9) | [cl] Tecnimoles (página de Calpe) · [C] clean-airco (página de Calpe) · Todaqui · [cl] Aliclima · [cl] Maxaire | Anuncios: climamed, Dukto (conductos). [d] ProntoPro. Mapa muy anglosajón |
| 08 | limpieza aire acondicionado villajoyosa | Paco 4,7 (29) · Limpia y Confort 4,3 (42) · Paco 4,3 (8) · Inst. Mañas 4,8 (33) | [cl] Paco · [cl] Tecnimoles (página) · Facebook Paco · [cl] Benimestic (página) · [d] ProntoPro | Resumen de IA. [d] Habitissimo, comercioscomunitatvalenciana.com |
| 09 | aire acondicionado huele mal | — | **Resumen de IA** · [i] Hitachi · [i] Bosch · vídeos · Reddit · [i] MediaMarkt, Kosner | Shopping (sprays). Las búsquedas relacionadas («a humedad», «a cloaca», «al encenderlo») dan para una guía |
| 10 | air conditioner cleaning benidorm | Climaled · Serviaire · **[C] Clining** · Tecnivent | **[C] Clining** · **[C] acbenidorm.es** · **[C] buenaire.pro (EN)** · [cl] Airecomfort · [C] clean-airco | Anuncio climagadea. Alpino Clima (EN, 2017), grupo de Facebook neerlandés. **Google lo trata como búsqueda en español** |

## 3. Competencia

Fuentes: las SERP de la sección 2 y el estudio de precios del 24-11-2026 (`datos/estudio_precios_2026-11-24.md`). La tarifa de ese estudio (69 €) quedó sustituida por la de M0.3: 85 € el split en casa, 59 € de lanzamiento hasta el 23/12/26.

### Precio de un split doméstico (IVA incluido)

| Quién | Precio | Qué incluye |
|---|---|---|
| BuenAire | 39 € / 59 € / 119 € | Filtros / básica / profunda con desmontaje parcial |
| Tecnimoles | desde 59 € | Filtros, batería y revisión de gas |
| Beniclima | 60 € / 90 € | Básica (filtros y revisión) / con desagüe, turbina y batería exterior. Desplazamiento incluido |
| **Ti&Di (lanzamiento)** | **59 €** | Limpieza en profundidad, hasta el 23/12/26 |
| **Clining** | 85 € | −15 % en la primera limpieza; si hay varios equipos, «se negocia» |
| **Ti&Di** | **85 €** | Desmontaje, lavado a presión de batería y turbina, fotos del antes y el después |
| ClimatizAlicante | 90,75 € | Unidad interior |
| Guías (Cronoshare, HogarConfort) | 50–100 € | ~100 € el servicio estándar en Alicante |

**Posicionamiento:** con la tarifa actual, Ti&Di cobra lo mismo que Clining y menos que las empresas de climatización, que además revisan el gas. Las diferencias que podemos comunicar son tres:

1. **Precio cerrado por varios equipos** (150, 210 y +55 €). Nadie lo publica; Clining dice «se negocia».
2. **Profundidad de la limpieza a la vista:** desmontaje, lavado a presión y fotos del antes y el después. Es nuestra respuesta a la «desinfección» de Clining y AC Benidorm, que no podemos prometer (M1.8).
3. **Lo hacen las mismas dos personas** (Tamar y David), en español, inglés y valenciano.

### Competidores directos (se dedican a la limpieza)

| Competidor | Web | Precio visto | Ficha | Qué hace bien | Debilidad |
|---|---|---|---|---|---|
| **Clining** | limpiezaapartamentos.es | Desde 85 €/equipo | 4,9 (31), categoría *Servicios de limpieza* | 1.º orgánico en 01, 03, 10 y en el mapa de 03 y 10 con solo 31 reseñas. Precio en el snippet | Una sola página para todo; empresa de limpieza de apartamentos, no especialista. **Basa la publicidad en desinfección** («eliminamos moho y bacterias»), justo lo que nosotros no podemos decir (M1.8) |
| **BuenAire** | buenaire.pro | 39 € (filtros) / 59 € (básica) / 119 € (profunda) | ? | Web en ES y EN, apartamentos turísticos, WhatsApp. Citado en el resumen de IA | No sale en el mapa |
| **AC Benidorm** | acbenidorm.es | ? | ? | Dominio exacto, título «Limpieza de Aire Acondicionado Benidorm» | Habla de «desinfección AC» |
| **Clean Airco** | clean-airco.com | Cuota de 14,95 €/mes (2 limpiezas al año) | ? | Una página por municipio (Benidorm, Altea, Calpe) que rankea en todos | Modelo de suscripción, no de servicio puntual |

### Climatización que también ofrece limpieza

Tecnimoles (desde 59 € IVA incl., una página por municipio y F-Gas), Benimestic (220 €/año + IVA), Beniclima (60 € con desplazamiento), Climalgar (páginas por municipio), Climática/Tecnivent, Airecomfort. **En el mapa mandan** Climaled (550 reseñas), Tecnivent (249) y Benimestic (220), es decir, volumen de reseñas y categoría de climatización.

### Directorios que rankean (para M6.3)

ProntoPro (Benidorm, Calp, Villajoyosa), Habitissimo (Benidorm, Villajoyosa), HomeServe, Trustlocal, Cronoshare (precio), comercioscomunitatvalenciana.com, Wallapop.

### Anuncios (para M7.5)

climagadea.es y climamed.es pujan por «limpieza aire acondicionado» en toda la zona. CPC de la parte alta de la página en Alicante: 1,02–1,76 € (limpieza), 1,02–2,56 € (mantenimiento).

## 4. Volúmenes

Media mensual de los últimos 12 meses. Entre paréntesis, el mes de pico. «—» = Keyword Planner no devuelve datos (menos de 10 al mes).

### Español

| Búsqueda | Alicante | España |
|---|---|---|
| aire acondicionado benidorm | **140** (jul 320) | 320 |
| limpieza aire acondicionado | 70 (jun–jul 170) | 1.300 (jun–jul 3.600) |
| mantenimiento aire acondicionado | 70 (jul 170) | 1.900 |
| limpiar filtros aire acondicionado | 70 (jul–ago 210) | 1.600 |
| limpieza de aire acondicionado | 20 | 390 |
| limpieza split aire acondicionado | 20 | 480 |
| limpieza conductos aire acondicionado | 20 | 320 |
| aire acondicionado no enfria | 20 | 590 |
| aire acondicionado gotea | 20 | 390 |
| aire acondicionado huele mal | 10 | 390 |
| aire acondicionado huele a humedad | 10 | 140 |
| aire acondicionado moho | 10 | 110 |
| mantenimiento aire acondicionado precio | 10 | 170 |
| limpieza aire acondicionado precio | 10 | 70 |
| precio limpieza aire acondicionado | 10 | 40 |
| cuanto cuesta limpiar aire acondicionado | 10 | 30 |
| limpieza profunda aire acondicionado | 10 | 20 |
| limpieza split | 10 | 10 |
| limpieza / mantenimiento aire acondicionado + cualquier municipio (también Benidorm) | — | — |
| limpieza split benidorm · oficinas · restaurante · hotel · apartamento turístico · empresas · a domicilio | — | — |

### Inglés

Prácticamente no hay datos: en Alicante, 60 búsquedas al mes entre todas. Solo dan cifra *air conditioner leaking water* (20; 140 en España), *air conditioning benidorm* (10), *aircon smells bad* (10) y *air conditioner smells musty* (10). Todas las combinaciones de *cleaning + municipio* salen «—».

### Qué nos dicen

1. **Mercado pequeño y muy estacional.** La zona suma unas 580 búsquedas al mes en español, y de mayo a agosto se multiplican por 4–8. Lanzamos en temporada baja, lo que nos da unos 5 meses para posicionarnos antes del pico.
2. **Las búsquedas «servicio + municipio» no tienen volumen medible, pero sí SERP local**: Google enseña mapa y páginas de municipio, con Clining, Clean Airco y Tecnimoles ahí. Pesan más el mapa y la ficha que el volumen.
3. **«Mantenimiento» se busca tanto como «limpieza»** (y en España, más), pero en la SERP salen instaladores que revisan el gas. Ti&Di no hace mantenimiento, así que se descarta.
4. **El inglés no tiene volumen en Keyword Planner**, pero la búsqueda 10 sí tiene competencia en inglés (BuenAire, K&M Air Con, AirCon Ninjas en Calpe). La versión `/en/` se justifica por conversión (residentes que comparan), no por tráfico.
5. **Los problemas (huele mal, gotea, moho) tienen volumen nacional** y la SERP es informativa, con resumen de IA, fabricantes y vídeos. Son guías a largo plazo (M7.1), no páginas de servicio.
6. **Conductos**: 320 al mes en España y 20 en Alicante. No hay servicio y no se hace página.

## 5. Búsqueda → página

| Página | Búsqueda principal | Secundarias | Title propuesto (≤ 60) | H1 propuesto |
|---|---|---|---|---|
| `/benidorm/` (M2.6, destino de la ficha) | limpieza aire acondicionado benidorm | limpieza split benidorm · aire acondicionado benidorm · los 7 municipios (en el texto, no en páginas aparte) | Limpieza de aire acondicionado en Benidorm · Ti&Di | Limpieza de aire acondicionado en Benidorm y alrededores |
| `/` (M2.1) | limpieza aire acondicionado | limpieza split aire acondicionado · limpieza de aire acondicionado · marca | Limpieza de aire acondicionado a fondo · Limpiamos tu aire | Limpiamos tu aire acondicionado por dentro |
| `/precios/` (M2.2) | precio limpieza aire acondicionado | limpieza aire acondicionado precio · cuánto cuesta limpiar un split (PAA) | Precio de limpieza de aire acondicionado · Tarifa por split | Cuánto cuesta limpiar un aire acondicionado |
| `/como-lo-hacemos/` (M2.3) | limpieza profunda aire acondicionado | cómo se limpia un aire acondicionado por dentro (PAA) · limpieza split | Limpieza profunda de split: cómo lo hacemos | Así limpiamos tu split, paso a paso |
| `/negocios/` (M2.4) | limpieza aire acondicionado negocios | oficinas · restaurante · local comercial · hotel | Limpieza de aire acondicionado para negocios y empresas (sin «Benidorm»: solo va en el title de `/benidorm/`) | Limpieza de aire acondicionado para negocios |
| `/apartamentos-turisticos/` (M2.9, #45) | limpieza aire acondicionado apartamento turístico | alquiler vacacional · entre temporadas · varios pisos | Limpieza de aire acondicionado en apartamentos turísticos | Aire acondicionado limpio para tu apartamento turístico |
| `/en/` (M4.1) | air conditioning cleaning benidorm | aircon cleaning · air con cleaning · Costa Blanca · Altea, Calpe | Air conditioning cleaning in Benidorm · Ti&Di | Air conditioning cleaning in Benidorm and nearby |
| Guías (M7.1) | aire acondicionado huele mal | huele a humedad · moho · gotea · limpiar filtros (guía DIY + «cuándo llamar») | — | — |
| *(ninguna)* | limpieza conductos | Se menciona en «qué no incluye» de `/precios/` | — | — |

«Mantenimiento» no va en titles, H1 ni descripciones: Ti&Di no hace mantenimiento (ni gas ni reparaciones). Como mucho, se nombra para aclarar la diferencia («no es un mantenimiento: no revisamos el gas ni reparamos»).

Reglas contra la canibalización: «Benidorm» solo en el title de `/benidorm/` (la home lo nombra en el texto, no en title ni H1). El precio va en `/precios/`; las demás páginas enseñan solo el «desde» y enlazan allí.

## 6. Decisiones abiertas

- [x] Competencia cruzada con el estudio de precios del 24-11-2026 (sección 3).
- [x] «Mantenimiento»: no se usa como palabra clave; Ti&Di solo limpia (25-11-2026).
- [x] Apartamentos turísticos: página propia, `/apartamentos-turisticos/`, issue M2.9 #45 (25-11-2026).
- [x] Categoría de la ficha: la principal ya es *Servicios de limpieza*, la misma que Clining. Sin secundarias (ver `docs/ficha-google.md`).
- [x] Páginas por municipio: se decide en M7.6 con datos de Search Console. Hoy no hay volumen, aunque Clean Airco y Tecnimoles rankean con ellas (25-11-2026).
