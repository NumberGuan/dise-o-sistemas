# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Módulo de clientes y Ventas

El módulo de Clientes permite buscar y filtrar, crear clientes, editar sus datos y su estado, consultar el detalle y ver los pedidos asociados. Las cuentas con rol Cliente también aparecen en Ventas; su perfil comercial y estado se editan desde allí, mientras que el correo de inicio de sesión permanece sin cambios. La actividad del cliente se obtiene de sus pedidos registrados.

En Pedidos se pueden crear y editar pedidos, consultar el detalle y avanzar su estado o cancelarlos. El servidor verifica clientes activos al crear, productos del catálogo, cantidades, vendedor, fechas y totales antes de guardar.

Para usar la tienda, registrate en `/register` o ingresá en `/login` con una cuenta de rol Cliente. Desde el catálogo de `/compras/catalogo` podés buscar y ordenar productos, marcarlos como favoritos y agregarlos al carrito. Completá el domicilio y la localidad en `/compras/perfil`; después, en `/compras/carrito`, ajustá o quitá productos y confirmá el pedido. La confirmación no procesa un pago. Consultá el estado del pedido en `/compras/pedidos`; Ventas ve y actualiza el mismo pedido desde su módulo. Las cuentas con rol Ventas gestionan los clientes y los pedidos desde `/ventas/clientes` y `/ventas/pedidos`.

Para iniciar la aplicación y revisar los tipos:

```bash
npm install
npm run dev
npm run typecheck
```

Para evitar conflictos de archivos generados en Windows y OneDrive, ejecutá `npm run typecheck` con el servidor de desarrollo detenido.

Los datos de cuentas, perfiles de cliente, favoritos, carrito y pedidos de cuentas registradas se guardan en `data/users.json`. Los clientes locales de Ventas y los pedidos asociados a clientes locales se guardan en `data/sales.json`, que se inicializa con registros de muestra la primera vez que se usa. El archivo de cuentas se crea automáticamente si falta; mantené ambos archivos en el almacenamiento persistente del servidor.

Estos archivos JSON sirven para una instancia de la aplicación. Las escrituras del archivo de Ventas se serializan dentro del proceso y se reemplazan de forma atómica, pero JSON no coordina varias instancias ni ofrece una base de datos compartida. Para escalar a varios servidores, hace falta migrar esos datos a un servicio de almacenamiento transaccional.

La maqueta no integra pagos externos ni sincronización de stock con un sistema de inventario. Los demás módulos conservan sus datos de muestra.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 -e SESSION_SECRET="<secreto-aleatorio-unico>" my-app
```

En producción, configurá `SESSION_SECRET` con un valor aleatorio propio y mantenelo fuera del repositorio. La aplicación no inicia en modo producción si falta este secreto.

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
## Administración y catálogos

Ingresá como Administrador y abrí **Administración → Gestión del sistema** (`/administracion`). El buscador permite encontrar catálogos y accesos a las pantallas de gestión de todos los módulos.

Los 14 catálogos disponibles son: tipos de cliente, modalidades de entrega, métodos de pago, tipos de IVA, tipos de documento, cargos, provincias, localidades, calles, unidades de medida, tipos de producto, tipos de materia prima, marcas y tipos de mantenimiento. Cada uno tiene listado, búsqueda, filtros, consulta, alta y edición con estado activo/inactivo. Las rutas de lectura y escritura verifican el rol Administrador en el servidor.

Los cambios se guardan en `data/catalogs.json`, creado al guardar el primer cambio. Antes de eso se usan las opciones iniciales de la maqueta. Los formularios de clientes y perfiles, pedidos, recibos y señas, proveedores, empleados, producción y mantenimiento consumen los catálogos compartidos. Las marcas de este catálogo corresponden a materias primas de Producción; Compras conserva sus cotizaciones y precios por combinación de insumo y proveedor.

La baja es lógica: un registro inactivo deja de ofrecerse para nuevas selecciones y se conserva en los registros que ya lo usan. El nombre visible puede editarse; los identificadores y valores de referencia se mantienen para preservar las operaciones existentes. En domicilios, las nuevas selecciones usan el nombre vigente y las direcciones anteriores conservan el texto guardado. Provincias, localidades y calles respetan sus relaciones; para desactivar un registro superior primero deben desactivarse sus dependientes. Debe quedar al menos una opción activa en cada catálogo.

Una modalidad de entrega define si requiere dirección (envío) o permite retiro. Ese comportamiento y la ubicación superior de un registro existente no se pueden cambiar: se crea otro registro cuando cambia esa relación. Los tipos de IVA son condiciones de las personas; no configuran las alícuotas de facturación. Los cargos son funciones laborales y no otorgan permisos de acceso. Los estados de los circuitos de pedidos, facturación y producción conservan sus transiciones específicas.

Las entidades operativas mantienen sus pantallas de gestión, accesibles desde el centro de Administración. Domicilios, teléfonos y detalles de documentos se editan dentro de su registro principal. Los módulos que ya funcionaban con datos de muestra durante la sesión conservan ese alcance; la persistencia nueva corresponde a los catálogos.

El almacenamiento de catálogos usa una cola de escrituras y reemplazo de archivo atómico dentro de una instancia. Como el resto de los archivos JSON de esta maqueta, requiere almacenamiento persistente en el servidor y una base de datos transaccional para varias instancias.

Para verificar Administración:

```bash
npm run test:administracion
npm run typecheck
npm run build
```

Las pruebas usan una carpeta temporal y verifican altas concurrentes, duplicados, persistencia, permisos, baja lógica, referencias existentes, integración con clientes/pedidos/recibos y relaciones de domicilio.


El botón **+** de cada catálogo en Gestión del sistema y de sus campos en los formularios abre un modal de alta, disponible para el administrador. Al guardar, la opción queda activa y seleccionada automáticamente en el formulario de origen, conservando los datos que se estaban cargando. El modal muestra los errores de validación y la confirmación de guardado en la misma ventana; solo se cierra con la cruz superior. Hacer clic afuera o presionar Escape no lo cierra. En localidades y calles se propone la ubicación seleccionada en el formulario y se valida la relación antes de guardar.

Los clientes tienen una dirección fija de facturación obligatoria, seguida de direcciones complementarias opcionales. La dirección fija se puede editar y permanece en primer lugar; las complementarias se pueden agregar o quitar y seleccionar para entregas. Los comprobantes nuevos guardan la dirección de facturación para conservarla aunque después cambie el domicilio del cliente.

Clientes, empleados y proveedores permiten cargar un teléfono principal obligatorio y hasta 20 adicionales. Los adicionales se pueden agregar, quitar o intercambiar con el principal; las vistas de detalle muestran ambos por separado. Se rechazan números vacíos, repetidos y de más de 40 caracteres. Los teléfonos existentes se conservan como principales. Ventas y Mi perfil comparten los teléfonos de las cuentas de clientes; empleados y proveedores mantienen el almacenamiento durante la sesión que ya utilizaban. `npm run test:telefonos` verifica el guardado, la sincronización y las validaciones con datos aislados en una carpeta temporal.

### Donación en Ventas

La pantalla `/ventas/donacion` permite registrar un cliente activo, fecha, productos, cantidades y observaciones. El valor unitario, los subtotales y el total se calculan siempre en $0 en el servidor; estas operaciones no generan deuda ni se agregan a los pedidos comerciales. Se admiten productos del catálogo de muestra de Producción con stock y vencimiento entre la fecha elegida y los siete días siguientes. No se admiten fechas futuras, productos vencidos para esa fecha ni destinatarios genéricos de mostrador.

Las donaciones se guardan en `data/donaciones.json`, con nombres y vencimientos conservados en cada detalle. Las escrituras se serializan y las cantidades ya donadas se reservan contra el stock de muestra para evitar asignarlas nuevamente. El módulo de Producción continúa administrando sus productos durante la sesión; no hay un inventario persistente unificado entre módulos. Las fechas de muestra pueden no ofrecer productos elegibles para hoy. `npm run test:donaciones` ejecuta las pruebas en una carpeta temporal aislada.
