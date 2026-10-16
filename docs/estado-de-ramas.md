# Estado de ramas y cambios del proyecto

Este documento resume para qué sirve cada rama de trabajo y qué cambios se están publicando en GitHub. Cada rama conserva sus propios commits; no se combinan todos en una sola rama. `develop` es la rama de integración para una etapa posterior.

## Ramas de trabajo

### `feature/ventas-pedidocliente`

Reúne las mejoras del circuito de ventas y pedidos:

- Clientes con varias direcciones, calle y altura separadas, y saldo mensual calculado a partir de sus pedidos. Los comercios reciben el descuento del 15% en cada factura.
- Altas y detalles de clientes, pedidos y comprobantes en páginas completas. Desde un pedido se puede abrir la factura, y al facturar solo se ofrecen pedidos del cliente elegido.
- Correcciones en la aplicación de pagos y el cálculo de diferencias de recibos.
- Pedidos de mostrador y eventos. Los eventos guardan fecha y hora de entrega y requieren una seña de al menos el 50%.
- Navegación de los módulos mediante el menú lateral, formularios y detalles en páginas, y un botón visible para volver al listado dentro del contenido.
- Catálogo público para visitantes, con carrito. Para confirmar la compra o guardar favoritos hay que iniciar sesión o registrarse.
- Catálogo con 13 variedades de pastas de 500 g y 7 salsas de 250 g. Cada nombre indica el contenido del envase y se puede filtrar por Pastas o Salsas, combinando categoría, búsqueda, disponibilidad y orden de precios.
- Validación visual de formularios: al intentar guardar aparecen mensajes rojos debajo de los campos obligatorios pendientes, la vista se desplaza al primero y lo deja enfocado. Los avisos se quitan al corregir el dato. También se indican las secciones vacías, como productos, materias primas o medios de pago.
- Estética uniforme en los listados de presupuestos, recibos, remitos y devoluciones: tarjeta blanca, encabezado con contador, filtros, filas y botones con el mismo formato de Clientes y Pedidos. Los nombres del menú y de las pantallas pasan a ser «Presupuestos Clientes», «Pedidos Clientes», «Recibos de Pago Clientes» y «Remitos Cliente».

### `feature/pantallascliente`

Agrupa ajustes de la experiencia de cliente y del catálogo:

- Limita la búsqueda al catálogo de productos.
- Restringe al administrador los cambios de condición del cliente.
- Reubica la información del perfil sobre el botón de cierre de sesión y conserva los controles de búsqueda del listado.

### `feature/pantallacliente`

Contiene la experiencia de cliente dentro del módulo de compras, incluida en commits anteriores de esa rama.

### `feature/pantallainicio`

Contiene la integración de las pantallas de compras con las funciones de almacenamiento de `develop`.

### `feature/administracion`

Agrega email, DNI y sueldo a los datos de empleados y sus pantallas de administración.

### `feature/mantenimiento`

Contiene las pantallas y ajustes del módulo de mantenimiento.

### `feature/produccion`

Contiene las pantallas y animaciones del módulo de producción.

### `feature/compras`

Contiene el flujo de compras, incluidos remitos de proveedores y presupuestos.

## Cómo se publican y se integran

Al publicar, cada conjunto de commits se envía a su rama correspondiente en GitHub. Por ejemplo, los cambios de ventas van a `feature/ventas-pedidocliente` y los cambios de catálogo y experiencia de cliente van a `feature/pantallascliente`. Los commits de una rama no se copian automáticamente a las otras.

La publicación de estas ramas no realiza el merge a `develop`. En la segunda etapa se revisarán los cambios y se integrarán a `develop` según corresponda. Así, `develop` queda como punto común de integración y cada rama mantiene el historial de su módulo.

Los archivos locales de datos (`mockup_pastas/data/users.json` y `mockup_pastas/data/sales.json`) no forman parte de estos cambios publicados.
