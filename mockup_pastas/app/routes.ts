import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
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
      route("proveedores", "routes/compras/proveedores.tsx"),
      route("ordenes", "routes/compras/ordenes.tsx"),
      route("presupuestos", "routes/compras/presupuestos.tsx"),
      route("remitos", "routes/compras/remitos.tsx"),
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
      route("recibos-pagos", "routes/administracion/recibos-pagos.tsx"),
    ]),

    route("mantenimiento", "routes/mantenimiento.tsx", [
      route("maquinas", "routes/mantenimiento/maquinas.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
