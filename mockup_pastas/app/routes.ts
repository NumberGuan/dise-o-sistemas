import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  route("login", "routes/auth/login.tsx"),
  route("register", "routes/auth/register.tsx"),
  route("logout", "routes/auth/logout.tsx"),
  
  route("", "routes/protected.tsx", [
    layout("components/Layout.tsx", [
      index("routes/home.tsx"),

      route("ventas", "routes/ventas/layout.tsx", [
        index("routes/ventas/index.tsx"),
        route("clientes", "routes/ventas/clientes.tsx"),
        route("pedidos", "routes/ventas/pedidos.tsx"),
        route("comprobantes", "routes/ventas/comprobantes.tsx"),
        route("presupuestos", "routes/ventas/presupuestos.tsx"),
        route("remitos", "routes/ventas/remitos.tsx"),
        route("devoluciones", "routes/ventas/devoluciones.tsx"),
        route("recibos", "routes/ventas/recibos.tsx"),
      ]),

      route("compras", "routes/compras.tsx", [
        // Rutas internas de Compras (Administrador, Compras)
        route("proveedores", "routes/compras/proveedores.tsx"),
        route("proveedores/nueva", "routes/compras/proveedores-nuevo.tsx"),
        route("proveedores/:id", "routes/compras/proveedores-detalle.tsx"),
        route("proveedores/:id/modificar", "routes/compras/proveedores-modificar.tsx"),
        route("ordenes", "routes/compras/ordenes.tsx"),
        route("ordenes/nueva", "routes/compras/ordenes-nueva.tsx"),
        route("ordenes/:id", "routes/compras/ordenes-detalle.tsx"),
        route("presupuesto-proveedor", "routes/compras/presupuesto-proveedor.tsx"),
        route("presupuesto-proveedor/:id", "routes/compras/presupuesto-proveedor-detalle.tsx"),
        route("remito-proveedor", "routes/compras/remito-proveedor.tsx"),
        route("remitos", "routes/compras/remitos.tsx"),
        
        // Rutas de Cliente
        route("catalogo", "routes/compras/cliente-catalogo.tsx"),
        route("carrito", "routes/compras/cliente-carrito.tsx"),
        route("favoritos", "routes/compras/cliente-favoritos.tsx"),
        route("perfil", "routes/compras/cliente-perfil.tsx"),
        route("pedidos", "routes/compras/cliente-pedidos.tsx"),
      ]),

      route("produccion", "routes/produccion.tsx", [
        route("productos", "routes/produccion/productos.tsx"),
        route("materias-primas", "routes/produccion/materias-primas.tsx"),
        route("ordenes", "routes/produccion/ordenes.tsx"),
        route("recetas", "routes/produccion/recetas.tsx"),
        route("maquinas", "routes/produccion/maquinas.tsx"),
      ]),

      route("administracion", "routes/administracion.tsx", [
        route("empleados", "routes/administracion/empleados.tsx"),
      ]),

      route("mantenimiento", "routes/mantenimiento.tsx", [
        route("maquinas", "routes/mantenimiento/maquinas.tsx"),
        route("mantenimientos", "routes/mantenimiento/mantenimientos.tsx"),
      ]),
    ]),
  ]),
] satisfies RouteConfig;
