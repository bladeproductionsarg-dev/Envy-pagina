# Proyecto compartido entre IAs

## Fuente de verdad
Esta carpeta, `Envy-web`, contiene la web actual. El dueño usa Escritorio/Envy para los archivos nuevos. La web vende A Tag y anuncia futura domótica. No afirmar que es un Apple AirTag.

## Mapa
- `index.html`: estructura, textos, fotos, FAQ y enlaces.
- `styles.css`: identidad, modo oscuro, animaciones y responsive.
- `app.js`: precio de referencia, selección de cantidades, carrito, galería y demo.
- `assets/`: imágenes y logos; conservar los originales.
- `.openai/hosting.json`: identidad del sitio publicado. No cambiar su project_id ni crear un sitio nuevo al actualizarlo.
- `scripts/build.mjs`: copia los archivos públicos a dist. No publica nada.

## Forma de colaborar
1. Leer las instrucciones y revisar `git status` y los cambios existentes. No descartar trabajo ajeno.
2. Trabajar en una rama por cambio (Codex: `codex/descripcion`; otras herramientas: `claude/descripcion` o `gemini/descripcion`). Si varias IAs trabajan a la vez, usar clones o worktrees separados.
3. Hacer cambios pequeños. No incluir claves, contraseñas, archivos .env, datos de clientes ni credenciales en commits o ZIP.
4. Ejecutar `npm run check` y `npm run build`. Revisar el navegador en móvil y escritorio; probar las funciones modificadas y movimiento reducido.
5. Entregar un resumen y un commit. Con GitHub conectado, abrir un pull request para integrar el cambio; sin GitHub, entregar la rama o los archivos modificados al dueño.
6. Publicar es un paso separado. Un commit en GitHub no despliega por sí solo este sitio.

## Actualización de la web publicada
El alojamiento actual es Sites. Una herramienta con acceso autorizado debe leer `.openai/hosting.json`, obtener credenciales temporales desde la integración, sincronizar la fuente exacta, ejecutar el build, empaquetar dist junto con el manifiesto y publicar una versión guardada del mismo proyecto. No guardar credenciales en archivos. Conservar acceso público salvo que el dueño pida cambiarlo. Si otra IA no tiene la integración, puede editar y entregar el código para que Codex lo publique.

## Pendientes reales
GitHub no conectado. Falta dominio propio, backend de pedidos/inventario, integración de pagos propia y tarifas de entrega. Confirmar datos comerciales y del dispositivo antes de prometerlos. El código postal no cotiza envíos; la demostración no rastrea dispositivos reales. El checkout actual es un enlace a Mercado Libre y no transfiere la cantidad seleccionada.
