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
      { label: "Presupuestos Clientes", to: "/ventas/presupuestos" },
      { label: "Pedidos Clientes", to: "/ventas/pedidos" },
      { label: "Comprobantes de Venta", to: "/ventas/comprobantes" },
      { label: "Caja", to: "/ventas/caja" },
      { label: "Recibos de Pago Clientes", to: "/ventas/recibos" },
      { label: "Remitos Cliente", to: "/ventas/remitos" },
      { label: "Devoluciones", to: "/ventas/devoluciones" },
      { label: "Donación", to: "/ventas/donacion" },
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
    ],
  },
  {
    label: "Administración",
    to: "/administracion",
    items: [
      { label: "Gestión del sistema", to: "/administracion" },
      { label: "Empleados", to: "/administracion/empleados" },
    ],
  },
  {
    label: "Mantenimiento",
    to: "/mantenimiento",
    items: [
      { label: "Máquinas", to: "/mantenimiento/maquinas" },
      { label: "Mantenimiento de Máquinas", to: "/mantenimiento/mantenimientos" },
    ],
  },
];
