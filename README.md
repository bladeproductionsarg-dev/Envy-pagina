# ENVY — web estática

Abrir `index.html` directamente en un navegador. No necesita instalación ni compilación. Mantener juntos index.html, styles.css, app.js y assets/. La tipografía Inter se carga desde Google Fonts; sin conexión se usa Arial.

## Editar
- Contenido y enlaces: index.html.
- Colores, diseño, responsive y animaciones: styles.css.
- Precio de referencia, paquetes, carrito local y demostración: app.js.
- Logo y fotografías: assets/.

El logo iluminado conserva la imagen aportada por el propietario. Su entrada utiliza revelado y cambio de luminosidad de la imagen completa, no un trazado vectorial ni control independiente de segmentos. El movimiento reducido desactiva las animaciones.

## Comercio
El precio de $20.000 por unidad es una referencia anterior del propietario. Los grupos de 2 y 4 no tienen descuentos ni stock independiente. El máximo de 20 unidades es un límite de interfaz, no inventario. El carrito persiste en este navegador y no crea pedidos ni reserva productos. Al continuar en Mercado Libre, hay que elegir nuevamente la cantidad. No se transfieren líneas de carrito.

La portada enlaza directamente a la publicación y muestra el precio de referencia definido en app.js. La entrega se informa como retiro en Santos Lugares o entrega a domicilio a coordinar. El costo y la cobertura dependen de lo que acuerde el comprador. No hay cobro integrado, WhatsApp configurado, gestión de stock ni backend. Para habilitar Mercado Pago se necesita un servidor, credenciales privadas y validación de pagos con webhooks. Nunca poner secretos en app.js.

Antes de publicar: confirmar precio, características, compatibilidad, garantía, devoluciones, contacto y datos comerciales. No se afirma que sea un Apple AirTag, ni que tenga GPS en tiempo real. La demostración es ilustrativa.

## Datos del producto

El catálogo anterior identifica el contenido como localizador A Tag y llavero, visibles en `assets/a-tag-kit.png`. La foto de portada es una copia WebP optimizada de `assets/a-tag-lifestyle.png`. La llave ilustra el uso. Para afirmar compatibilidad con Apple Find My o Google Find Hub, o una pila CR2032 reemplazable, hace falta la ficha o el manual del modelo exacto.

## Medición futura

Los enlaces de compra llevan `data-event="mercadolibre_click"` y un atributo `data-placement` que identifica portada, carrito o seguridad. Hoy son atributos inertes. Cuando se autorice una herramienta de medición, registrar una activación del enlace (por teclado o toque) sin retrasar la navegación. Para comparar portadas, dividir las visitas móviles a la portada que incluyeron al menos un clic de compra por el total de visitas móviles a esa portada, usando el mismo período, origen y criterio de dispositivo. Contar cada visita una sola vez. Esta métrica mide salidas hacia la publicación, no ventas.

## Publicación
Sitio publicado: https://envy-smart-living.honeypixie514.chatgpt.site

El código actual está en esta carpeta y sincronizado con [GitHub: bladeproductionsarg-dev/Envy-pagina](https://github.com/bladeproductionsarg-dev/Envy-pagina). El repositorio es público, según la configuración que eligió el propietario al crearlo. El proyecto React anterior permanece intacto en Documentos/ChatGPT/Envy/envy-store; no es el proyecto publicado actual.

## Trabajar con otras IAs

Abrir esta carpeta completa en la herramienta elegida. Leer primero `AGENTS.md` y `COLABORACION.md`. Claude y Gemini tienen puntos de entrada `CLAUDE.md` y `GEMINI.md`. Las herramientas que no pueden editar carpetas pueden recibir el ZIP del proyecto.

Con Node.js instalado, `npm run check` valida JavaScript y `npm run build` prepara `dist/` sin descargar dependencias. Nunca editar dist directamente.

Los cambios locales o futuros commits en GitHub NO actualizan automáticamente la web publicada. Para actualizar la dirección actual, usar la integración Sites y el proyecto identificado en `.openai/hosting.json`. Se puede migrar a otro hosting estático sin reescribir la web.
