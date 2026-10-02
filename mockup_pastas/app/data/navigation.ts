export type NavItem = {
  label: string;
  to: string;
};

export type NavSection = {
  label: string;
  to: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Ventas",
    to: "/ventas",
        items: [
      { label: "Clientes", to: "/ventas/clientes" },
      { label: "Presupuesto Cliente", to: "/ventas/presupuestos" },
      { label: "Pedidos de Clientes", to: "/ventas/pedidos" },
      { label: "Comprobantes de Venta", to: "/ventas/comprobantes" },
      { label: "Recibos de Pago de Cliente", to: "/ventas/recibos" },
      { label: "Remito Cliente", to: "/ventas/remitos" },
      { label: "Devoluciones", to: "/ventas/devoluciones" },
    ],
  },
  {
    label: "Compras",
    to: "/compras",
    items: [
      { label: "Proveedores", to: "/compras/proveedores" },
      { label: "Órdenes a Proveedores", to: "/compras/ordenes" },
      { label: "Presupuesto Proveedor", to: "/compras/presupuesto-proveedor" },
      { label: "Remitos Proveedor", to: "/compras/remito-proveedor" },
    ],
  },
  {
    label: "Producción",
    to: "/produccion",
    items: [
      { label: "Productos", to: "/produccion/productos" },
      { label: "Materia Prima", to: "/produccion/materias-primas" },
      { label: "Órdenes de Producción", to: "/produccion/ordenes" },
      { label: "Recetas", to: "/produccion/recetas" },
      { label: "Máquinas", to: "/produccion/maquinas" },
    ],
  },
  {
    label: "Administración",
    to: "/administracion",
    items: [
      { label: "Empleados", to: "/administracion/empleados" },
      { label: "Recibos y Pagos", to: "/administracion/recibos-pagos" },
    ],
  },
  {
    label: "Mantenimiento",
    to: "/mantenimiento",
    items: [{ label: "Mantenimiento de Máquinas", to: "/mantenimiento/maquinas" }],
  },
];
