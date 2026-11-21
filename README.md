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

El formulario postal no cotiza tarifas: orienta a confirmar cobertura y precio en la publicación. No hay cobro integrado, WhatsApp configurado, gestión de stock ni backend. Para habilitar Mercado Pago se necesita un servidor, credenciales privadas y validación de pagos con webhooks. Nunca poner secretos en app.js.

Antes de publicar: confirmar precio, características, compatibilidad, garantía, devoluciones, contacto y datos comerciales. No se afirma que sea un Apple AirTag, ni que tenga GPS en tiempo real. La demostración es ilustrativa.

## Publicación
Sitio publicado: https://envy-smart-living.honeypixie514.chatgpt.site

El código actual está en esta carpeta y tiene historial Git local. Todavía no hay repositorio conectado en GitHub. El proyecto React anterior permanece intacto en Documentos/ChatGPT/Envy/envy-store; no es el proyecto publicado actual.

## Trabajar con otras IAs

Abrir esta carpeta completa en la herramienta elegida. Leer primero `AGENTS.md` y `COLABORACION.md`. Claude y Gemini tienen puntos de entrada `CLAUDE.md` y `GEMINI.md`. Las herramientas que no pueden editar carpetas pueden recibir el ZIP del proyecto.

Con Node.js instalado, `npm run check` valida JavaScript y `npm run build` prepara `dist/` sin descargar dependencias. Nunca editar dist directamente.

Los cambios locales o futuros commits en GitHub NO actualizan automáticamente la web publicada. Para actualizar la dirección actual, usar la integración Sites y el proyecto identificado en `.openai/hosting.json`. Se puede migrar a otro hosting estático sin reescribir la web.
