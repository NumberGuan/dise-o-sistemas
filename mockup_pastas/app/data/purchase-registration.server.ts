import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { purchasesFixtures } from "./compras-fixtures.server";
import { preparePurchaseAttachment, type StoredAttachment } from "./purchase-attachment-file.server";
import { PURCHASE_DOCUMENTS, type PurchaseDocumentKind } from "./purchase-registration";
import { MEDIOS_PAGO, getTotalComprobante } from "./facturacion-proveedores";
import type { PresupuestoProveedor } from "./presupuestos";
import type { ComprobanteVentaProveedor, ReciboPagoProveedor } from "./facturacion-proveedores";
import type { RemitoProveedor } from "./remitos";

type RecordByKind = { presupuesto: PresupuestoProveedor; factura: ComprobanteVentaProveedor; recibo: ReciboPagoProveedor; remito: RemitoProveedor };
type Registration = { [K in PurchaseDocumentKind]: { kind: K; record: RecordByKind[K]; attachment: StoredAttachment } }[PurchaseDocumentKind];
const directory = () => path.join(process.cwd(), "data", "purchase-documents");
let queue: Promise<unknown> = Promise.resolve();

export async function readPurchaseRegistrations(): Promise<Registration[]> {
  let names: string[];
  try { names = await fs.readdir(directory()); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
  return Promise.all(names.filter(name => /^(presupuesto|factura|recibo|remito)-\d+\.json$/.test(name)).map(async name => {
    const saved = JSON.parse(await fs.readFile(path.join(directory(), name), "utf8")) as Registration;
    if (!saved || !Object.hasOwn(PURCHASE_DOCUMENTS, saved.kind) || !saved.record?.id || !saved.attachment?.content) throw new Error("No se pudieron leer los comprobantes registrados. Se conservaron los archivos existentes.");
    return saved;
  }));
}

export async function getPurchaseData() {
  const registered = await readPurchaseRegistrations();
  return {
    ...purchasesFixtures,
    PRESUPUESTOS_PROVEEDOR: [...purchasesFixtures.PRESUPUESTOS_PROVEEDOR, ...registered.flatMap(row => row.kind === "presupuesto" ? [row.record] : [])],
    COMPROBANTES_VENTA_PROVEEDOR: [...purchasesFixtures.COMPROBANTES_VENTA_PROVEEDOR, ...registered.flatMap(row => row.kind === "factura" ? [row.record] : [])],
    RECIBOS_PAGO_PROVEEDOR: [...purchasesFixtures.RECIBOS_PAGO_PROVEEDOR, ...registered.flatMap(row => row.kind === "recibo" ? [row.record] : [])],
    REMITOS: [...purchasesFixtures.REMITOS, ...registered.flatMap(row => row.kind === "remito" ? [row.record] : [])],
  };
}

export function registerPurchaseDocument(kind: PurchaseDocumentKind, form: FormData) {
  const operation = queue.then(async () => {
    const data = await getPurchaseData();
    const text = (key: string) => String(form.get(key) ?? "").trim();
    const number = (key: string) => Number(text(key));
    const positive = (value: number) => Number.isFinite(value) && value > 0 && value <= 1e12;
    const date = (key: string) => {
      const value = text(key);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new Error("Ingresá una fecha válida.");
      return value;
    };
    const records = { presupuesto: data.PRESUPUESTOS_PROVEEDOR, factura: data.COMPROBANTES_VENTA_PROVEEDOR, recibo: data.RECIBOS_PAGO_PROVEEDOR, remito: data.REMITOS };
    const id = Math.max(0, ...records[kind].map(record => record.id)) + 1;
    const numero = text("numero");
    if (!numero || numero.length > 80) throw new Error("Ingresá el número del comprobante del proveedor.");
    const fechaEmision = date("fechaEmision");
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("Adjuntá el archivo del comprobante del proveedor.");
    const attachment = await preparePurchaseAttachment(file);
    if ((kind === "factura" || kind === "recibo") && !/^\d{1,5}$/.test(text("puntoVenta"))) throw new Error("Ingresá un punto de venta de hasta cinco dígitos.");
    if (kind === "factura" && text("cae") && !/^\d{14}$/.test(text("cae"))) throw new Error("El CAE debe contener catorce dígitos.");
    const common = { id, numero, fechaEmision };
    let registration: Registration;
    if (kind === "recibo") {
      const invoice = data.COMPROBANTES_VENTA_PROVEEDOR.find(invoice => invoice.id === number("idComprobanteVentaProveedor"));
      if (!invoice) throw new Error("Seleccioná la factura a la que corresponde el pago.");
      const idMedioPago = number("idMedioPago");
      if (!MEDIOS_PAGO.some(method => method.id === idMedioPago)) throw new Error("Seleccioná un medio de pago válido.");
      const montoPagado = number("montoPagado");
      const paid = data.RECIBOS_PAGO_PROVEEDOR.filter(receipt => receipt.idComprobanteVentaProveedor === invoice.id).reduce((sum, receipt) => sum + receipt.montoPagado, 0);
      if (!positive(montoPagado) || montoPagado > Math.round((getTotalComprobante(invoice) - paid) * 100) / 100) throw new Error("El monto debe ser mayor a cero y no superar el saldo de la factura.");
      registration = { kind, attachment, record: { ...common, letra: "X", puntoVenta: text("puntoVenta"), numeroComprobante: numero, idComprobanteVentaProveedor: invoice.id, idMedioPago, montoPagado } };
    } else {
      const idProveedor = number("idProveedor");
      if (!data.suppliers.proveedores.some(supplier => supplier.idPersona === idProveedor)) throw new Error("Seleccioná un proveedor válido.");
      const raw: unknown = JSON.parse(text("detalle") || "[]");
      if (!Array.isArray(raw) || !raw.length || raw.length > 100) throw new Error("Agregá al menos una materia prima.");
      const seen = new Set<number>();
      const detalle = raw.map(row => {
        if (!row || typeof row !== "object" || !data.MATERIAS_PRIMAS.some(product => product.id === row.idMateriaPrima) || seen.has(row.idMateriaPrima) || !positive(row.cantidad) || (kind !== "remito" && !positive(row.precioUnitario))) throw new Error("Revisá las materias primas, cantidades y precios. No se permiten materias primas repetidas.");
        seen.add(row.idMateriaPrima);
        const precioUnitario = kind === "remito" ? 0 : row.precioUnitario;
        const subtotal = Math.round(row.cantidad * precioUnitario * 100) / 100;
        if (!Number.isFinite(subtotal) || subtotal > 1e12) throw new Error("El importe de la línea es demasiado grande.");
        return { idMateriaPrima: row.idMateriaPrima as number, cantidad: row.cantidad as number, precioUnitario, subtotal };
      });
      if (kind === "presupuesto") {
        const fechaVencimiento = date("fechaVencimiento");
        if (fechaVencimiento < fechaEmision) throw new Error("El vencimiento no puede ser anterior a la emisión.");
        registration = { kind, attachment, record: { ...common, idProveedor, fechaVencimiento, detalle } };
      } else {
        const order = data.orders.find(order => order.id === number("idOrdenCompraProveedor") && order.idProveedor === idProveedor);
        if (!order && (kind === "factura" || text("idOrdenCompraProveedor"))) throw new Error("Seleccioná una orden de compra del proveedor elegido.");
        if (kind === "remito") {
          registration = { kind, attachment, record: { id, numero, idProveedor, fecha: fechaEmision, idOrdenCompraProveedor: order?.id ?? null, detalle } };
        } else {
          const importeIVA = number("importeIVA");
          if (!Number.isFinite(importeIVA) || importeIVA < 0 || importeIVA > 1e12) throw new Error("Ingresá un importe de IVA válido.");
          registration = { kind, attachment, record: { ...common, idProveedor, idOrdenCompraProveedor: order!.id, letra: "A", puntoVenta: text("puntoVenta"), numeroComprobante: numero, cae: text("cae"), importeNeto: Math.round(detalle.reduce((sum, line) => sum + line.subtotal, 0) * 100) / 100, importeIVA, detalle } };
        }
      }
    }
    const supplierOf = (record: RecordByKind[PurchaseDocumentKind]) => "idProveedor" in record
      ? record.idProveedor
      : data.COMPROBANTES_VENTA_PROVEEDOR.find(invoice => invoice.id === record.idComprobanteVentaProveedor)?.idProveedor;
    if (records[kind].some(record => record.numero === numero && supplierOf(record) === supplierOf(registration.record))) throw new Error("Ya existe ese número de comprobante para el proveedor.");
    await fs.mkdir(directory(), { recursive: true });
    const target = path.join(directory(), `${kind}-${id}.json`);
    const temporary = `${target}.${randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporary, JSON.stringify(registration));
      await fs.rename(temporary, target);
    } finally { await fs.rm(temporary, { force: true }); }
    return registration.record;
  });
  queue = operation.catch(() => undefined);
  return operation;
}
