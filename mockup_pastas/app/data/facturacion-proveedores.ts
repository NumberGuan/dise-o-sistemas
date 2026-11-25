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

export const getMedioPagoPorId = (id: number) =>
  MEDIOS_PAGO.find((medio) => medio.id === id);

export const getTotalComprobante = (comprobante: ComprobanteVentaProveedor) =>
  comprobante.importeNeto + comprobante.importeIVA;

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

export function createPurchaseBilling(COMPROBANTES_VENTA_PROVEEDOR: ComprobanteVentaProveedor[], RECIBOS_PAGO_PROVEEDOR: ReciboPagoProveedor[]) {
  const getComprobantePorId = (id: number) =>
    COMPROBANTES_VENTA_PROVEEDOR.find((comprobante) => comprobante.id === id);

  const getComprobantePorOrden = (idOrden: number) =>
    COMPROBANTES_VENTA_PROVEEDOR.find(
      (comprobante) => comprobante.idOrdenCompraProveedor === idOrden,
    );

  const getReciboPorId = (id: number) =>
    RECIBOS_PAGO_PROVEEDOR.find((recibo) => recibo.id === id);

  const getRecibosDelComprobante = (idComprobante: number) =>
    RECIBOS_PAGO_PROVEEDOR.filter(
      (recibo) => recibo.idComprobanteVentaProveedor === idComprobante,
    );

  const getTotalPagado = (idComprobante: number) =>
    getRecibosDelComprobante(idComprobante).reduce(
      (total, recibo) => total + recibo.montoPagado,
      0,
    );

  const getSaldoPendiente = (comprobante: ComprobanteVentaProveedor) =>
    Math.max(0, getTotalComprobante(comprobante) - getTotalPagado(comprobante.id));

  const getEstadoPago = (
    comprobante: ComprobanteVentaProveedor,
  ): EstadoPago => {
    const total = getTotalComprobante(comprobante);
    const pagado = getTotalPagado(comprobante.id);
    if (pagado <= 0) {
      return "Pendiente";
    }
    return pagado >= total ? "Pagado" : "Parcial";
  };
  return { getComprobantePorId, getComprobantePorOrden, getReciboPorId, getRecibosDelComprobante, getTotalPagado, getSaldoPendiente, getEstadoPago };
}
