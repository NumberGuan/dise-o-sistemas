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
      { label: "Productos", to: "/ventas/productos" },
      { label: "Pedidos de Clientes", to: "/ventas/pedidos" },
      { label: "Comprobantes de Venta", to: "/ventas/comprobantes" },
    ],
  },
  {
    label: "Compras",
    to: "/compras",
    items: [
      { label: "Proveedores", to: "/compras/proveedores" },
      { label: "Materias Primas", to: "/compras/materias-primas" },
      { label: "Órdenes a Proveedores", to: "/compras/ordenes" },
    ],
  },
  {
    label: "Producción",
    to: "/produccion",
    items: [
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