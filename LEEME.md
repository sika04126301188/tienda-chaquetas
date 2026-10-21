# Chaket · Plantilla premium de All Pixels

Tienda de chaquetas de plumón ligero con la chaqueta en 3D, en cuatro páginas. Todas las fotos y todos los
objetos 3D salen del mismo modelo de la colección «Plumón ligero» (cuello alto, manga raglán, nueve canales,
cremallera de espiral con tirador «ch» y bolsillos de cremallera oculta) en cinco colores:
verde salvia, café, azul marino, negro y rojo.

- **index.html**: «Chaket» enorme en Bodoni sobre la chaqueta roja grande, un armario 3D con las chaquetas colgadas
  de lado (al pasar el ratón, la chaqueta sale de la barra y se gira para verse entera), la cinta de marcas,
  el configurador con visor 3D sobre polígonos rojos (el visor acompaña al bajar), la colección con el precio
  de cada chaqueta y la oferta de la semana con cuenta atrás.
- **producto.html**: ficha de cada chaqueta: gira sola en 360°, barra de giro de 0 a 360°, frente y espalda,
  colores disponibles, tallas con existencias al momento, cesta y «Comprar ahora».
- **coleccion-3d.html**: la colección en 3D: visor grande (girar, acercar con rueda o pellizco), cinco colores,
  vistas guiadas (frente, espalda, perfil, cuello, bolsillo y puño), talla con existencias y «Añadir a la cesta»;
  fotos de estudio, detalles de cerca, medidas de la talla M y los cinco modelos GLB para descargar.
- **pago.html**: pago exprés, tres pasos (contacto, envío y pago), tarjeta en 3D que se gira para el CVC,
  Bizum, PayPal y transferencia, resumen oscuro con la chaqueta del pedido girando, código de descuento y recibo final.

## Cómo abrirla
Haz doble clic en `index.html`. Funciona sin servidor y sin internet: las fuentes (Bodoni Moda y Manrope),
las librerías y las texturas del 3D van dentro de la carpeta.

## Carpetas
```
index.html, producto.html, coleccion-3d.html, pago.html
                      Las páginas (HTML semántico sin clases ni divs; el CSS va dentro de <style>)
img/chaquetas/        Fotos recortadas (fondo transparente) de cada color: frente y espalda, y la colección junta
img/coleccion/        Fotos de estudio, detalles de cerca y ficha de medidas de la página en 3D
modelos/              Los cinco modelos 3D en GLB (unos 5 MB cada uno, con sus texturas dentro)
img/icono.png         Icono de la pestaña
img/fondos/           Fondos decorativos (polígonos, aros, hexágonos y manchas) en los colores de la marca
js/catalogo.js        Los productos: marca, nombre, precio, colores, existencias por color y talla
js/tienda.js          Cabecera, menú, cesta (se guarda en el navegador), aviso al añadir, club y totales
js/armario.js         El armario 3D del hero
js/visor.js           El visor 3D (configurador, ficha en 360° y resumen del pago)
js/coleccion-3d.js    La página de la colección en 3D
js/inicio.js          Portada: armario y configurador
js/producto.js        Ficha del producto
js/pago.js            Página de pago y recibo
js/chaket-3d.js       Carga el modelo y lo pinta con el color de cada chaqueta (tela, ribetes, forro y cremallera)
js/modelo.js          El modelo 3D completo (GLB comprimido dentro del script para que funcione sin servidor)
js/modelo-ligero.js   Versión ligera del modelo para el armario y el resumen del pago
js/GLTFLoader.js, js/RoomEnvironment.js, js/meshopt-decoder.js   Cargador del GLB, luz de estudio y descompresor
js/three.min.js       three.js r159 (licencia MIT en js/three-LICENSE.txt)
fonts/                Bodoni Moda y Manrope (licencia OFL)
```

## El armario
- Las chaquetas cuelgan de su gancho de metal en una barra cromada, de lado, como en una tienda.
- Al pasar el ratón por una: se levanta un poco, sale hacia ti, se acerca al centro y gira despacio hasta quedar de frente.
  Las de al lado se apartan y se balancean en su percha (péndulos de verdad: si la percha se mueve, la chaqueta se queda
  un poco atrás y luego oscila hasta pararse). Todos los movimientos son muelles amortiguados: sin tirones ni rebotes.
- Una etiqueta sigue a la chaqueta con la marca, el nombre y el precio. Al hacer clic se abre su ficha.
- En el móvil: el primer toque la gira y el segundo abre la ficha. Con el teclado, cada chaqueta tiene su enlace.

## La cesta y el pago
- La cesta se guarda en el navegador (localStorage): se conserva al cambiar de página o al volver otro día.
- Envío estándar 4,95 € (gratis desde 100 €), exprés 9,95 € y recogida en tienda gratis. El código **CHAKET10** descuenta un 10 %.
- La tarjeta comprueba el número (Visa, Mastercard o Amex), la caducidad y el CVC. Para probar: 4242 4242 4242 4242.
- **El cobro está simulado**: no se envía ningún dato. Para cobrar de verdad hay que conectar el pago con una pasarela
  (Stripe, Redsys, PayPal…) y la cesta con tu tienda.

## El pie
- Arriba, el Club sobre un horizonte rojo con estrellas; debajo, una tarjeta con la marca, las redes
  y tres columnas de enlaces (con etiquetas como «Contratamos» o «-10 %») y los legales.
- Los enlaces de ayuda, legales y redes llevan `#`: cámbialos por tus páginas y perfiles.

## Cambiar contenidos
- Productos, precios, colores y existencias: `js/catalogo.js`. La ficha, la cesta y el pago lo leen de ahí.
  Si cambias un precio o un nombre, cámbialo también en su tarjeta de la colección en `index.html`.
- Marcas de la cinta: la primera lista de la sección de marcas en `index.html` (8 marcas inventadas).
- Oferta de la semana: sección `#oferta` de `index.html`. La cuenta atrás termina cada domingo a las 23:59.
- Colores: `js/catalogo.js` (lista `colores`, con su tono en `muestra`). El 3D se pinta solo con ese tono;
  las fotos de `img/chaquetas/` se llaman como el color (`rojo.webp`, `rojo-espalda.webp`…).
- Las cinco chaquetas de la tienda comparten el mismo modelo 3D; cambia el nombre, la marca o el precio en
  `js/catalogo.js` y su tarjeta en `index.html`.

## Importante
- El formulario del Club está simulado: conéctalo a tu servicio de correo.
- Chaket y las marcas son ficticias. Precios, opiniones, existencias y datos fiscales son de ejemplo.
- Sin WebGL se ven las fotos normales. Con «reducir movimiento» no hay animaciones ni giro automático.
