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
