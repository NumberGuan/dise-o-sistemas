import type { ProveedoresState } from "./proveedores";
import type { MateriaPrima, OrdenCompra } from "./ordenes";
import type { ComprobanteVentaProveedor, ReciboPagoProveedor } from "./facturacion-proveedores";
import type { RemitoProveedor } from "./remitos";
import type { PresupuestoProveedor } from "./presupuestos";

const INITIAL_STATE: ProveedoresState = {
  domicilios: [
    {
      id: 1,
      calle: "Av. de los Cerezos",
      altura: "550",
      localidad: "La Plata",
      provincia: "Buenos Aires",
    },
    {
      id: 2,
      calle: "Ruta 36",
      altura: "km 85",
      localidad: "Brandsen",
      provincia: "Buenos Aires",
    },
    {
      id: 3,
      calle: "Calle Alsina",
      altura: "842",
      localidad: "Berisso",
      provincia: "Buenos Aires",
    },
    {
      id: 4,
      calle: "Camino Centenario",
      altura: "3100",
      localidad: "City Bell",
      provincia: "Buenos Aires",
    },
    {
      id: 5,
      calle: "Av. 44",
      altura: "2750",
      localidad: "La Plata",
      provincia: "Buenos Aires",
    },
  ],
  proveedores: [
    {
      idPersona: 1,
      estado: "Activo",
      idDomicilio: 1,
      idTipoDocumento: 1,
      nroDocumento: 30111222333,
      nombre: "Molino La Plata S.A.",
      apellido: "",
      email: "ventas@molinolaplata.com.ar",
      telefono: "0221 425-6677",
    },
    {
      idPersona: 2,
      estado: "Activo",
      idDomicilio: 2,
      idTipoDocumento: 1,
      nroDocumento: 30222333444,
      nombre: "AgroHarinas S.R.L.",
      apellido: "",
      email: "agroharinas@gmail.com",
      telefono: "0221 429-8899",
    },
    {
      idPersona: 3,
      estado: "Inactivo",
      idDomicilio: 3,
      idTipoDocumento: 1,
      nroDocumento: 30555666777,
      nombre: "Proveedora del Norte",
      apellido: "",
      email: "compras@proveedoranorte.com",
      telefono: "0381 456-7788",
    },
    {
      idPersona: 4,
      estado: "Activo",
      idDomicilio: 4,
      idTipoDocumento: 3,
      nroDocumento: 25111112,
      nombre: "Juan",
      apellido: "Pérez",
      email: "juan.perez@gmail.com",
      telefono: "0221 15-334-5566",
    },
    {
      idPersona: 5,
      estado: "Activo",
      idDomicilio: 5,
      idTipoDocumento: 2,
      nroDocumento: 20222222,
      nombre: "María",
      apellido: "González",
      email: "maria.gonzalez@gmail.com",
      telefono: "0221 15-667-8899",
    },
  ],
};

export const PRESUPUESTOS = [
  { id: 101, numero: "PP-2024-001", idProveedor: 1, total: 120000 },
  { id: 102, numero: "PP-2024-002", idProveedor: 1, total: 96000 },
  { id: 103, numero: "PP-2024-003", idProveedor: 2, total: 85000 },
];

export const MATERIAS_PRIMAS: MateriaPrima[] = [
  {
    id: 1,
    nombre: "Harina 000",
    marcas: [
      { id: 1, nombre: "Molino La Plata", precioUnitario: 450 },
      { id: 2, nombre: "AgroHarinas", precioUnitario: 430 },
    ],
  },
  {
    id: 2,
    nombre: "Harina 0000",
    marcas: [
      { id: 3, nombre: "Molino La Plata", precioUnitario: 520 },
      { id: 4, nombre: "AgroHarinas", precioUnitario: 500 },
    ],
  },
  {
    id: 3,
    nombre: "Sémola de trigo",
    marcas: [
      { id: 5, nombre: "AgroHarinas", precioUnitario: 610 },
      { id: 6, nombre: "Proveedora del Norte", precioUnitario: 590 },
    ],
  },
  {
    id: 4,
    nombre: "Huevos frescos",
    marcas: [
      { id: 7, nombre: "Granja Don Juan", precioUnitario: 180 },
      { id: 8, nombre: "Granja Santa Clara", precioUnitario: 170 },
    ],
  },
  {
    id: 5,
    nombre: "Sal",
    marcas: [{ id: 9, nombre: "Salinas del Sur", precioUnitario: 40 }],
  },
];

const INITIAL_ORDENES: OrdenCompra[] = [
  {
    id: 1,
    numero: "OC-2024-0001",
    idProveedor: 1,
    idPresupuestoProveedor: 101,
    fechaEmision: "2026-08-20",
    detalle: [
      { idMateriaPrima: 1, idMarca: 1, cantidad: 50, subtotal: 22500 },
      { idMateriaPrima: 2, idMarca: 3, cantidad: 30, subtotal: 15600 },
      { idMateriaPrima: 4, idMarca: 7, cantidad: 10, subtotal: 1800 },
    ],
  },
  {
    id: 2,
    numero: "OC-2024-0002",
    idProveedor: 2,
    idPresupuestoProveedor: 103,
    fechaEmision: "2026-09-01",
    detalle: [
      { idMateriaPrima: 3, idMarca: 5, cantidad: 20, subtotal: 12200 },
      { idMateriaPrima: 5, idMarca: 9, cantidad: 100, subtotal: 4000 },
    ],
  },
  {
    id: 3,
    numero: "OC-2024-0003",
    idProveedor: 3,
    idPresupuestoProveedor: null,
    fechaEmision: "2026-09-12",
    detalle: [{ idMateriaPrima: 1, idMarca: 1, cantidad: 80, subtotal: 36000 }],
  },
  {
    id: 4,
    numero: "OC-2024-0004",
    idProveedor: 1,
    idPresupuestoProveedor: 102,
    fechaEmision: "2026-09-18",
    detalle: [
      { idMateriaPrima: 2, idMarca: 3, cantidad: 45, subtotal: 23400 },
      { idMateriaPrima: 3, idMarca: 5, cantidad: 10, subtotal: 6100 },
    ],
  },
];

export const COMPROBANTES_VENTA_PROVEEDOR: ComprobanteVentaProveedor[] = [
  {
    id: 1,
    numero: "CV-2026-0001",
    letra: "A",
    puntoVenta: "0001",
    numeroComprobante: "00000001",
    cae: "70417054367476",
    fechaEmision: "2026-08-28",
    idOrdenCompraProveedor: 1,
    idProveedor: 1,
    importeNeto: 39900,
    importeIVA: 8379,
    detalle: [
      { idMateriaPrima: 1, cantidad: 50, precioUnitario: 450, subtotal: 22500 },
      { idMateriaPrima: 2, cantidad: 30, precioUnitario: 520, subtotal: 15600 },
      { idMateriaPrima: 4, cantidad: 10, precioUnitario: 180, subtotal: 1800 },
    ],
  },
  {
    id: 2,
    numero: "CV-2026-0002",
    letra: "A",
    puntoVenta: "0001",
    numeroComprobante: "00000002",
    cae: "70417054367477",
    fechaEmision: "2026-09-08",
    idOrdenCompraProveedor: 2,
    idProveedor: 2,
    importeNeto: 16200,
    importeIVA: 3402,
    detalle: [
      { idMateriaPrima: 3, cantidad: 20, precioUnitario: 610, subtotal: 12200 },
      { idMateriaPrima: 5, cantidad: 100, precioUnitario: 40, subtotal: 4000 },
    ],
  },
  {
    id: 3,
    numero: "CV-2026-0003",
    letra: "A",
    puntoVenta: "0001",
    numeroComprobante: "00000003",
    cae: "70417054367478",
    fechaEmision: "2026-09-21",
    idOrdenCompraProveedor: 4,
    idProveedor: 1,
    importeNeto: 29500,
    importeIVA: 6195,
    detalle: [
      { idMateriaPrima: 2, cantidad: 45, precioUnitario: 520, subtotal: 23400 },
      { idMateriaPrima: 3, cantidad: 10, precioUnitario: 610, subtotal: 6100 },
    ],
  },
  {
    id: 4,
    numero: "CV-2026-0004",
    letra: "A",
    puntoVenta: "0001",
    numeroComprobante: "00000004",
    cae: "70417054367479",
    fechaEmision: "2026-09-25",
    idOrdenCompraProveedor: 3,
    idProveedor: 3,
    importeNeto: 36000,
    importeIVA: 7560,
    detalle: [
      { idMateriaPrima: 1, cantidad: 80, precioUnitario: 450, subtotal: 36000 },
    ],
  },
];

export const RECIBOS_PAGO_PROVEEDOR: ReciboPagoProveedor[] = [
  {
    id: 1,
    numero: "RPP-2026-0001",
    letra: "X",
    puntoVenta: "0001",
    numeroComprobante: "00000001",
    fechaEmision: "2026-09-01",
    idComprobanteVentaProveedor: 1,
    idMedioPago: 1,
    montoPagado: 48279,
  },
  {
    id: 2,
    numero: "RPP-2026-0002",
    letra: "X",
    puntoVenta: "0001",
    numeroComprobante: "00000002",
    fechaEmision: "2026-09-12",
    idComprobanteVentaProveedor: 2,
    idMedioPago: 2,
    montoPagado: 10000,
  },
  {
    id: 3,
    numero: "RPP-2026-0003",
    letra: "X",
    puntoVenta: "0001",
    numeroComprobante: "00000003",
    fechaEmision: "2026-09-29",
    idComprobanteVentaProveedor: 3,
    idMedioPago: 3,
    montoPagado: 35695,
  },
];

export const REMITOS: RemitoProveedor[] = [
  {
    id: 1,
    numero: "RP-2026-0001",
    idProveedor: 1,
    idOrdenCompraProveedor: 1,
    fecha: "2026-08-25",
    detalle: [
      { idMateriaPrima: 1, cantidad: 50 },
      { idMateriaPrima: 2, cantidad: 30 },
    ],
  },
  {
    id: 2,
    numero: "RP-2026-0002",
    idProveedor: 2,
    idOrdenCompraProveedor: 2,
    fecha: "2026-09-05",
    detalle: [{ idMateriaPrima: 3, cantidad: 20 }],
  },
  {
    id: 3,
    numero: "RP-2026-0003",
    idProveedor: 1,
    idOrdenCompraProveedor: 4,
    fecha: "2026-09-20",
    detalle: [
      { idMateriaPrima: 2, cantidad: 45 },
      { idMateriaPrima: 3, cantidad: 10 },
      { idMateriaPrima: 5, cantidad: 100 },
    ],
  },
  {
    id: 4,
    numero: "RP-2026-0004",
    idProveedor: 3,
    idOrdenCompraProveedor: 3,
    fecha: "2026-09-22",
    detalle: [{ idMateriaPrima: 1, cantidad: 80 }],
  },
];

export const PRESUPUESTOS_PROVEEDOR: PresupuestoProveedor[] = [
  {
    id: 1,
    numero: "PP-2024-001",
    idProveedor: 1,
    fechaEmision: "2026-09-20",
    fechaVencimiento: "2026-10-05",
    detalle: [
      { idMateriaPrima: 1, cantidad: 45, subtotal: 20250 },
      { idMateriaPrima: 2, cantidad: 25, subtotal: 13000 },
    ],
  },
  {
    id: 2,
    numero: "PP-2024-002",
    idProveedor: 2,
    fechaEmision: "2026-09-02",
    fechaVencimiento: "2026-09-15",
    detalle: [
      { idMateriaPrima: 3, cantidad: 18, subtotal: 10980 },
      { idMateriaPrima: 5, cantidad: 80, subtotal: 3200 },
    ],
  },
  {
    id: 3,
    numero: "PP-2024-003",
    idProveedor: 3,
    fechaEmision: "2026-08-25",
    fechaVencimiento: "2026-09-12",
    detalle: [{ idMateriaPrima: 1, cantidad: 60, subtotal: 27000 }],
  },
  {
    id: 4,
    numero: "PP-2024-004",
    idProveedor: 1,
    fechaEmision: "2026-09-15",
    fechaVencimiento: "2026-10-20",
    detalle: [
      { idMateriaPrima: 2, cantidad: 40, subtotal: 20800 },
      { idMateriaPrima: 3, cantidad: 12, subtotal: 7320 },
    ],
  },
  {
    id: 5,
    numero: "PP-2024-005",
    idProveedor: 2,
    fechaEmision: "2026-09-22",
    fechaVencimiento: "2026-10-01",
    detalle: [
      { idMateriaPrima: 4, cantidad: 30, subtotal: 5400 },
      { idMateriaPrima: 1, cantidad: 30, subtotal: 13500 },
    ],
  },
];

export const purchasesFixtures = {
  suppliers: INITIAL_STATE,
  orders: INITIAL_ORDENES,
  PRESUPUESTOS, MATERIAS_PRIMAS, COMPROBANTES_VENTA_PROVEEDOR, RECIBOS_PAGO_PROVEEDOR, REMITOS, PRESUPUESTOS_PROVEEDOR,
};
