# ENVY — web estática

Abrir `index.html` directamente en un navegador. No necesita instalación ni compilación. Mantener juntos index.html, styles.css, app.js y assets/. La tipografía Inter se carga desde Google Fonts; sin conexión se usa Arial.

## Editar
- Contenido y enlaces: index.html.
- Colores, diseño, responsive y animaciones: styles.css.
- Precio de referencia, paquetes, carrito local y demostración: app.js.
- Logo y fotografías: assets/.

El logo iluminado conserva la imagen aportada por el propietario. Su entrada utiliza revelado y cambio de luminosidad de la imagen completa, no un trazado vectorial ni control independiente de segmentos. El movimiento reducido desactiva las animaciones.

## Venta directa

Con Node 24 o superior, ejecutar `npm ci`, `npm run build` y `npm start`. El servidor abre en http://127.0.0.1:5177. El modo predeterminado es de prueba. Usa pedidos y stock separados, datos ficticios y pagos simulados.

La venta directa comienza con 40 unidades. El precio del pedido completo depende de la cantidad: 1–5 a $20.000 por unidad, 6–14 a $17.500 y 15 o más a $15.000. El catálogo está en `catalog.mjs`. Retiro en Santos Lugares y entrega gratuita en CABA. La zona de envío se valida en el servidor. Las localidades del conurbano quedan pendientes de confirmación.

El comprador elige la cantidad, entrega y medio de pago en `checkout.html`. El servidor verifica precios y disponibilidad antes de registrar el pedido y descontar inventario en una única transacción. Un reintento con la misma referencia devuelve el pedido existente. El número de pedido permite recuperar el estado mediante el enlace de confirmación. La consulta pública omite los datos de contacto.

### Activar y gestionar

- Para ventas reales, ejecutar el proceso con `ENVY_MODE=live`. Transferencias al alias **felipillo.com.ar** y pago al recibir están habilitados en ese modo. Los pedidos por transferencia quedan pendientes de verificación.
- Para tarjetas, configurar `MP_PUBLIC_KEY` y `MP_ACCESS_TOKEN` en el entorno del servidor. Usar credenciales de prueba con una base separada para la homologación del vendedor antes de habilitar tarjetas en producción. El formulario integrado usa Card Payment Brick. El token privado queda en el servidor. Cada pago usa la referencia del pedido como clave de idempotencia. El servidor consulta a Mercado Pago para reconciliar los pagos pendientes, incluso tras un reinicio. Revisar un pedido que permanezca pendiente antes de intentar cobrarlo nuevamente. [Documentación de Mercado Pago](https://www.mercadopago.com.ar/developers/es/docs/checkout-bricks/card-payment-brick/payment-submission)
- El proceso necesita un servidor Node de ejecución continua con HTTPS y disco persistente. `HOST` y `PORT` controlan la escucha. `ENVY_DATA_DIR` indica el directorio privado de datos (predeterminado: .envy-store en el directorio personal). Hacer copia de seguridad de SQLite. El alojamiento estático actual sirve el catálogo y mantiene Mercado Libre como alternativa.
- Con el mismo entorno y directorio de datos, `npm run pedidos` muestra las ventas y los datos de entrega en la terminal privada del vendedor. Tras comprobar un pago manual en la cuenta o recibir el efectivo, usar `node server.mjs --acreditar UUID`. Para cancelar un pedido manual pendiente y devolver sus unidades al stock, usar `node server.mjs --cancelar UUID`.

## Datos del producto

El catálogo anterior identifica el contenido como localizador A Tag y llavero, visibles en `assets/a-tag-kit.png`. La foto de portada es una copia WebP optimizada de `assets/a-tag-lifestyle.png`. La llave ilustra el uso. Para afirmar compatibilidad con Apple Find My o Google Find Hub, o una pila CR2032 reemplazable, hace falta la ficha o el manual del modelo exacto.

## Videos de ENVY

La sección «Cómo funciona» contiene la guía vertical de 53 segundos, con accesos al encendido y a cada sistema. Son copias editadas de los videos facilitados por el propietario. Se conserva la narración de los tramos utilizados. Las cabeceras y el cierre del anuncio son de ENVY. La guía ilustra el procedimiento para cada red compatible.

Para probar saltos directos a los capítulos, el servidor debe responder a solicitudes HTTP Range con 206 Partial Content.

Los MP4, los subtítulos WebVTT y la portada del tutorial están en `assets/`. Se reproducen al interactuar y usan controles nativos. Al reemplazar un video hay que revisar también la duración, los subtítulos y los tiempos de los capítulos en `index.html`.

## Estructura de la web

ENVY se presenta como empresa de seguridad y domótica, en varias páginas que comparten encabezado, menú, pie, carrito y tema. A Tag es su primer producto y vive en la tienda.

| Página | Contenido |
|---|---|
| `index.html` (Inicio) | «Seguridad inteligente para vivir más tranquilo», emblema con la intro, directorio de áreas y A Tag destacado. Breve: no obliga a recorrer la tienda. |
| `que-hacemos.html` | Tres áreas en acordeón: Seguridad inteligente (disponible: A Tag), Hogar inteligente y Soluciones para negocios (en desarrollo). |
| `quienes-somos.html` | Visión de ENVY; texto propuesto a validar. |
| `tienda.html` | Tienda completa de A Tag: ficha con giro, precio y compra (`#a-tag`), anuncio de 14 s (`.ad`), recorrido, notas, tutorial (`#funciona`), cantidades y carrito (`#comprar`), confianza (`#seguridad`), preguntas (`#preguntas`). |
| `proyectos.html` | Línea en desarrollo, sin casos inventados. |
| `contacto.html` | Datos confirmados por el dueño (23/11/2026): WhatsApp +54 9 11 6273-2505, email bladeproductions.arg@gmail.com, Instagram @f_blade_m, tienda/Mercado Libre y Santos Lugares. |

- **Encabezado y menú:** iguales en todas las páginas, copiados en cada HTML (sitio estático, sin plantillas). Al cambiar el menú o el pie, cambiarlo en las seis páginas. La página actual lleva `aria-current="page"`. Hasta 900 px el menú se abre con el botón «Menú» (Esc lo cierra). «Comprar A Tag» lleva a `tienda.html#comprar`.
- **WhatsApp:** botón flotante `.wa-float` en las seis páginas (en celular solo el ícono), con mensaje ya escrito; en la tienda menciona A Tag. Se oculta con el carrito o el menú abiertos. Número: 5491162732505 (`wa.me`).
- **Al final de cada página interna** hay «Seguí recorriendo» con enlaces a páginas relacionadas.
- **Transición entre páginas:** `@view-transition` (fundido corto) en navegadores que lo soportan; con movimiento reducido no hay transición.
- **Carrito:** el contador y el diálogo están en todas las páginas (mismo `localStorage`); los paquetes solo en la tienda.
- `scripts/build.mjs` copia las seis páginas a `dist/`.

Datos que debe completar el dueño: historia, equipo, años de trayectoria y zonas de trabajo (Quiénes somos); servicios e instalaciones que ofrece hoy (Qué hacemos y Proyectos); si recibe consultas de proyectos (Contacto). Están marcados con comentarios `COMPLETAR` y la etiqueta visible «Pendiente»; retirarlas al completarlos.

## Portada y recorrido del producto

Todo el movimiento se dibuja con imágenes transparentes sobre el azul noche de la página: no hay recuadros, videos incrustados ni controles en la portada.

- **Logo del encabezado:** `assets/logo-nav.png` (y `logo-nav@2x.png`) son recortes con transparencia de `logo.png`; la silueta no se modificó. El archivo anterior `logo-glow.webp` (ya no se usa en ninguna página) era opaco y, mezclado con `mix-blend-mode: screen`, dibujaba un cuadrado visible; ya no se usa.
- **Intro (una vez por sesión, ~1,5 s, solo en Inicio):** el emblema de ENVY de la portada de empresa se dibuja en contorno, un reflejo naranja recorre la arista superior y se enciende el detalle verde. El título y los accesos están visibles desde el primer cuadro. El emblema es un SVG con las 8 piezas del logo vectorizadas desde `Envy-logo.png` (silueta exacta). Después, el emblema flota muy despacio. Se decide en un script del `<head>` (clases `motion` e `intro` en `<html>`).
- **A Tag con llavero (tienda, `.ad`):** nombre, precio y botón de compra junto a un bucle silencioso de 6 s (`a-tag-llavero-loop.mp4`, 960×960, sin audio) hecho con la foto real del anuncio (`assets/tag/llavero.webp`, el A Tag en su soporte con argolla y llave) sobre azul noche, con leve balanceo y un reflejo. Sin controles ni botón; se carga al acercarse y se pausa fuera de pantalla. Con movimiento reducido, en modo claro o si el video no carga, se ve la foto fija. El anuncio con voz de 14 s (`a-tag-anuncio-envy.mp4`) ya no se muestra; el único video con sonido es el tutorial.
- **Giro en bucle del A Tag (tienda):** el A Tag gira solo y en silencio: frente → perfil → reverso → vuelta, cada ~7 s. Avanza por tiempo, no por scroll, y nunca bloquea el desplazamiento. Los 53 cuadros (`assets/tag/giro-00.webp` … `giro-52.webp`) se descargan recién cuando la sección está por aparecer; se pausa fuera de pantalla, con la pestaña oculta o con el botón discreto de pausa.
- **«Así es por fuera» (`#producto`):** tres vistas fijas (frente, reverso, con llavero) con scroll normal.
- **Carrito:** la miniatura es `assets/a-tag-carrito.webp` (A Tag con llavero, fondo transparente, cuadrada, `object-fit: contain`). En modo oscuro se mezcla con el diálogo; en claro va sobre un mosaico azul noche.
- **Movimiento reducido o sin JavaScript:** no hay intro, flotación ni giro; se ve el emblema completo y el A Tag quieto.
- **Más abajo:** la demo «Así de simple» avanza sola mientras se ve y `proyectos.html` dibuja el emblema al aparecer.

### Textos según cómo se compra

En alojamiento estático (GitHub Pages, Sites) la compra continúa en Mercado Libre; con `server.mjs` responde `/api/tienda` y la página pasa a compra directa (`body.is-direct`). Los textos que dependen de eso van en pares `<span class="only-static">` / `<span class="only-direct">`: precio de la ficha de A Tag, texto bajo el botón, cinta, «Elegí la cantidad», envío, seguridad y pago. Al cambiar una condición comercial, revisar los dos.

### Imágenes livianas y vista al compartir

Las miniaturas usan versiones chicas (`favicon-64.png`, `apple-touch-icon.png`, `logo-96.png`, `a-tag-kit-thumb.webp`, `a-tag-front-thumb.webp`); los PNG originales quedan en `assets/` sin cargarse. `assets/og-envy.jpg` (1200 × 630) es la imagen que muestran WhatsApp y las redes al compartir el link (metas `og:` en `index.html`, con la dirección de GitHub Pages).

### Tema

Toda la web y el checkout arrancan en azul noche (`#070D18`). Un script en el `<head>` aplica la clase `dark` en `<html>` antes de pintar, así no hay destello blanco. Solo se recuerda una elección explícita del selector (`localStorage` `envy-theme` = `light`/`dark`).

### Tutorial

«Cómo configurar tu A Tag»: sin paneles, sobre el fondo de la página. Escritorio: título y capítulos (Encendido, iPhone, Android) a la izquierda, video 9:16 grande a la derecha. Celular: capítulos encima del video; al elegir uno se encuadran capítulos y video completo. Portada `a-tag-guia-conectar.webp` (pantalla «Tocá Conectar») con botón de reproducción integrado; al reproducir aparecen los controles nativos (pausa, subtítulos, pantalla completa). Los subtítulos están activos por defecto.

La lógica está al final de `app.js` (`heroTag`, `autoDemo`, `futureEmblem`, `areas`, `menu`, `adPlayer`). 

## Medición futura

Los enlaces a Mercado Libre llevan `data-event="mercadolibre_click"` y un atributo `data-placement`. Al habilitar la compra directa, el botón de portada y el del carrito pasan al checkout de ENVY y dejan de emitir esa señal. Hoy son atributos inertes. Cuando se autorice una herramienta de medición, registrar una activación del enlace (por teclado o toque) sin retrasar la navegación. Para comparar portadas, dividir las visitas móviles a la portada que incluyeron al menos un clic de compra por el total de visitas móviles a esa portada, usando el mismo período, origen y criterio de dispositivo. Contar cada visita una sola vez. Esta métrica mide salidas hacia la publicación, no ventas.

## Publicación
Sitio publicado: https://envy-smart-living.honeypixie514.chatgpt.site

GitHub Pages (público, sin iniciar sesión): **https://envy.com.ar/** — dominio propio registrado en NIC Argentina el 23/11/2026 (vence el 23/11/2027), DNS en Cloudflare (registros A a las IPs de GitHub y CNAME www, en modo "solo DNS"); el archivo `CNAME` fija el dominio y la dirección anterior bladeproductionsarg-dev.github.io/Envy-pagina redirige sola. se publica solo desde la raíz de la rama `main` cada vez que cambia. Es alojamiento estático: no corre `server.mjs`, así que la compra continúa en Mercado Libre. `.nojekyll` evita que GitHub procese los archivos.

El código actual está en esta carpeta y sincronizado con [GitHub: bladeproductionsarg-dev/Envy-pagina](https://github.com/bladeproductionsarg-dev/Envy-pagina). El repositorio es público, según la configuración que eligió el propietario al crearlo. El proyecto React anterior permanece intacto en Documentos/ChatGPT/Envy/envy-store; no es el proyecto publicado actual.

## Trabajar con otras IAs

Abrir esta carpeta completa en la herramienta elegida. Leer primero `AGENTS.md` y `COLABORACION.md`. Claude y Gemini tienen puntos de entrada `CLAUDE.md` y `GEMINI.md`. Las herramientas que no pueden editar carpetas pueden recibir el ZIP del proyecto.

Con Node 24+, `npm run check` valida JavaScript y `npm run build` prepara los archivos públicos en `dist/`. Nunca editar dist directamente.

Los cambios locales o futuros commits en GitHub NO actualizan automáticamente la web publicada. Para actualizar la dirección actual, usar la integración Sites y el proyecto identificado en `.openai/hosting.json`. Se puede migrar a otro hosting estático sin reescribir la web.
