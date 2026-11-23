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

## Portada y recorrido del producto

Todo el movimiento se dibuja con imágenes transparentes sobre el azul noche de la página: no hay recuadros, videos incrustados ni controles en la portada.

- **Intro (una vez por sesión, ~1,5 s):** el emblema de ENVY se dibuja en contorno, un reflejo naranja recorre la arista superior, se enciende el detalle verde y el mismo reflejo revela el canto blanco del A Tag. El título, el precio y el botón de compra están visibles desde el primer cuadro. El emblema es un SVG con las 8 piezas del logo vectorizadas desde `Envy-logo.png` (silueta exacta, uniones de 1 px).
- **Giro:** el A Tag pasa del canto a su frente en tres cuartos y queda quieto. Usa `assets/tag/giro-00.webp` … `giro-52.webp`, 53 cuadros recortados del video de giro generado con Gemini (sin audio ni cabecera). El recorte se hizo con un modelo de segmentación y se neutralizó el tono cálido del video para que el producto se integre con el fondo. `giro-00` es la imagen fija y el respaldo.
- **Recorrido «Así es por fuera» (`#producto`):** la escena queda fija mientras el scroll cambia la vista: frente con un reflejo, giro hasta el reverso con acercamiento a las flechas, y vuelta al frente para que aparezca el llavero alrededor del mismo disco (`assets/tag/llavero.webp`, recorte de `a-tag-lifestyle.png` alineado con el disco del giro).
- **Movimiento reducido o sin JavaScript:** no hay intro; la portada muestra el emblema completo y el A Tag quieto, y el recorrido se ve como tres vistas fijas con su texto.

La lógica está al final de `app.js` (`heroTag` y `productTour`). La intro se decide en un script del `<head>` de `index.html` (clases `motion` e `intro` en `<html>`). El anuncio cuadrado de 14 s (`a-tag-anuncio-envy.mp4`) ya no se muestra en la página.

## Medición futura

Los enlaces a Mercado Libre llevan `data-event="mercadolibre_click"` y un atributo `data-placement`. Al habilitar la compra directa, el botón de portada y el del carrito pasan al checkout de ENVY y dejan de emitir esa señal. Hoy son atributos inertes. Cuando se autorice una herramienta de medición, registrar una activación del enlace (por teclado o toque) sin retrasar la navegación. Para comparar portadas, dividir las visitas móviles a la portada que incluyeron al menos un clic de compra por el total de visitas móviles a esa portada, usando el mismo período, origen y criterio de dispositivo. Contar cada visita una sola vez. Esta métrica mide salidas hacia la publicación, no ventas.

## Publicación
Sitio publicado: https://envy-smart-living.honeypixie514.chatgpt.site

El código actual está en esta carpeta y sincronizado con [GitHub: bladeproductionsarg-dev/Envy-pagina](https://github.com/bladeproductionsarg-dev/Envy-pagina). El repositorio es público, según la configuración que eligió el propietario al crearlo. El proyecto React anterior permanece intacto en Documentos/ChatGPT/Envy/envy-store; no es el proyecto publicado actual.

## Trabajar con otras IAs

Abrir esta carpeta completa en la herramienta elegida. Leer primero `AGENTS.md` y `COLABORACION.md`. Claude y Gemini tienen puntos de entrada `CLAUDE.md` y `GEMINI.md`. Las herramientas que no pueden editar carpetas pueden recibir el ZIP del proyecto.

Con Node 24+, `npm run check` valida JavaScript y `npm run build` prepara los archivos públicos en `dist/`. Nunca editar dist directamente.

Los cambios locales o futuros commits en GitHub NO actualizan automáticamente la web publicada. Para actualizar la dirección actual, usar la integración Sites y el proyecto identificado en `.openai/hosting.json`. Se puede migrar a otro hosting estático sin reescribir la web.
