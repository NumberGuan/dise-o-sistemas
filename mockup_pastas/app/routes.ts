import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("components/Layout.tsx", [
    index("routes/home.tsx"),

    route("ventas", "routes/ventas.tsx", [
      route("clientes", "routes/ventas/clientes.tsx"),
      route("productos", "routes/ventas/productos.tsx"),
      route("pedidos", "routes/ventas/pedidos.tsx"),
      route("comprobantes", "routes/ventas/comprobantes.tsx"),
    ]),

    route("compras", "routes/compras.tsx", [
      route("proveedores", "routes/compras/proveedores.tsx"),
      route("materias-primas", "routes/compras/materias-primas.tsx"),
      route("ordenes", "routes/compras/ordenes.tsx"),
    ]),

    route("produccion", "routes/produccion.tsx", [
      route("ordenes", "routes/produccion/ordenes.tsx"),
      route("recetas", "routes/produccion/recetas.tsx"),
      route("maquinas", "routes/produccion/maquinas.tsx"),
    ]),

    route("administracion", "routes/administracion.tsx", [
      route("empleados", "routes/administracion/empleados.tsx"),
      route("recibos-pagos", "routes/administracion/recibos-pagos.tsx"),
    ]),

    route("mantenimiento", "routes/mantenimiento.tsx", [
      route("maquinas", "routes/mantenimiento/maquinas.tsx"),
    ]),
  ]),
] satisfies RouteConfig;