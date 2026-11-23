export type MedioPago = {
  id: number;
  tipo: string;
  observacion: string;
};

export type DetalleComprobanteVentaProveedor = {
  idMateriaPrima: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

export type ComprobanteVentaProveedor = {
  id: number;
  numero: string;
  letra: "A";
  puntoVenta: string;
  numeroComprobante: string;
  cae: string;
  fechaEmision: string;
  idOrdenCompraProveedor: number;
  idProveedor: number;
  importeNeto: number;
  importeIVA: number;
  detalle: DetalleComprobanteVentaProveedor[];
};

export type ReciboPagoProveedor = {
  id: number;
  numero: string;
  letra: "X";
  puntoVenta: string;
  numeroComprobante: string;
  fechaEmision: string;
  idComprobanteVentaProveedor: number;
  idMedioPago: number;
  montoPagado: number;
};

export type EstadoPago = "Pagado" | "Parcial" | "Pendiente";

export const EMPRESA = {
  razonSocial: "Fábrica de Pastas Don Luis S.A.",
  cuit: "30-71000000-4",
  domicilio: "Av. de los Cerezos 100, La Plata, Buenos Aires",
  condicionIVA: "IVA RESPONSABLE INSCRITO",
};

export const MEDIOS_PAGO: MedioPago[] = [
  {
    id: 1,
    tipo: "Transferencia",
    observacion: "Transferencia bancaria a la cuenta del proveedor.",
  },
  {
    id: 2,
    tipo: "Efectivo",
    observacion: "Pago en efectivo en la tesorería de la fábrica.",
  },
  {
    id: 3,
    tipo: "Cheque",
    observacion: "Cheque emitido a nombre del proveedor.",
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

export const getComprobantePorId = (id: number) =>
  COMPROBANTES_VENTA_PROVEEDOR.find((comprobante) => comprobante.id === id);

export const getComprobantePorOrden = (idOrden: number) =>
  COMPROBANTES_VENTA_PROVEEDOR.find(
    (comprobante) => comprobante.idOrdenCompraProveedor === idOrden,
  );

export const getReciboPorId = (id: number) =>
  RECIBOS_PAGO_PROVEEDOR.find((recibo) => recibo.id === id);

export const getMedioPagoPorId = (id: number) =>
  MEDIOS_PAGO.find((medio) => medio.id === id);

export const getRecibosDelComprobante = (idComprobante: number) =>
  RECIBOS_PAGO_PROVEEDOR.filter(
    (recibo) => recibo.idComprobanteVentaProveedor === idComprobante,
  );

export const getTotalComprobante = (comprobante: ComprobanteVentaProveedor) =>
  comprobante.importeNeto + comprobante.importeIVA;

export const getTotalPagado = (idComprobante: number) =>
  getRecibosDelComprobante(idComprobante).reduce(
    (total, recibo) => total + recibo.montoPagado,
    0,
  );

export const getSaldoPendiente = (comprobante: ComprobanteVentaProveedor) =>
  Math.max(0, getTotalComprobante(comprobante) - getTotalPagado(comprobante.id));

export const getEstadoPago = (
  comprobante: ComprobanteVentaProveedor,
): EstadoPago => {
  const total = getTotalComprobante(comprobante);
  const pagado = getTotalPagado(comprobante.id);
  if (pagado <= 0) {
    return "Pendiente";
  }
  return pagado >= total ? "Pagado" : "Parcial";
};

export const formatearCUIT = (nroDocumento: number) => {
  const valor = String(nroDocumento);
  return `${valor.slice(0, 2)}-${valor.slice(2, 10)}-${valor.slice(10)}`;
};

const UNIDADES = [
  "", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO",
  "NUEVE", "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE",
  "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE",
];
const DECENAS = [
  "", "", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA",
  "SETENTA", "OCHENTA", "NOVENTA",
];
const VEINTI = [
  "VEINTIUNO", "VEINTIDÓS", "VEINTITRÉS", "VEINTICUATRO", "VEINTICINCO",
  "VEINTISÉIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE",
];
const CENTENAS = [
  "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS",
  "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS",
];

const grupoALetras = (numero: number): string => {
  if (numero === 100) {
    return "CIEN";
  }
  const partes: string[] = [];
  const centena = Math.floor(numero / 100);
  const resto = numero % 100;
  if (centena > 0) {
    partes.push(CENTENAS[centena]);
  }
  if (resto < 20) {
    if (resto > 0) {
      partes.push(UNIDADES[resto]);
    }
  } else if (resto > 20 && resto < 30) {
    partes.push(VEINTI[resto - 21]);
  } else {
    const decena = Math.floor(resto / 10);
    const unidad = resto % 10;
    partes.push(unidad ? `${DECENAS[decena]} Y ${UNIDADES[unidad]}` : DECENAS[decena]);
  }
  return partes.join(" ");
};

export const numeroALetras = (monto: number): string => {
  const entero = Math.floor(Math.abs(monto));
  const centavos = Math.round((Math.abs(monto) - entero) * 100);
  const partes: string[] = [];
  const millones = Math.floor(entero / 1_000_000);
  const miles = Math.floor((entero % 1_000_000) / 1000);
  const unidades = entero % 1000;

  if (millones > 0) {
    partes.push(
      `${grupoALetras(millones)} ${millones === 1 ? "MILLÓN" : "MILLONES"}`,
    );
  }
  if (miles > 0) {
    partes.push(miles === 1 ? "MIL" : `${grupoALetras(miles)} MIL`);
  }
  if (unidades > 0) {
    partes.push(grupoALetras(unidades));
  }

  return `${partes.join(" ") || "CERO"} PESOS CON ${String(centavos).padStart(2, "0")}/100`;
};
