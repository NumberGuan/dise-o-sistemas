import { useState } from "react";
import { data, Form, Link, redirectDocument, useActionData, useLoaderData, useNavigation } from "react-router";
import type { Route } from "./+types/comprobante-nuevo";
import ModulePageHeader from "~/components/ModulePageHeader";
import { requireUserAndRole } from "~/utils/session.server";
import { getPurchaseData, registerPurchaseDocument } from "~/data/purchase-registration.server";
import { PURCHASE_DOCUMENTS, type PurchaseDocumentKind } from "~/data/purchase-registration";
import { ATTACHMENT_ACCEPT, MAX_ATTACHMENT_SIZE } from "~/data/purchase-attachments";
import { MEDIOS_PAGO, getTotalComprobante } from "~/data/facturacion-proveedores";
import { formatMoney } from "~/data/ordenes";

function getKind(request: Request): PurchaseDocumentKind {
  const section = new URL(request.url).pathname.split("/")[2];
  const kind = (Object.keys(PURCHASE_DOCUMENTS) as PurchaseDocumentKind[]).find(key => PURCHASE_DOCUMENTS[key].path === section);
  if (!kind) throw new Response("Pantalla no encontrada.", { status: 404 });
  return kind;
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserAndRole(request, ["Administrador"]);
  return { kind: getKind(request), purchases: await getPurchaseData() };
}

export async function action({ request }: Route.ActionArgs) {
  await requireUserAndRole(request, ["Administrador"]);
  const kind = getKind(request);
  try {
    if (Number(request.headers.get("Content-Length")) > MAX_ATTACHMENT_SIZE + 256 * 1024) throw new Error("El archivo debe pesar hasta 10 MB.");
    await registerPurchaseDocument(kind, await request.formData());
  } catch (error) {
    if (error instanceof Response) throw error;
    return data({ error: error instanceof Error ? error.message : "No se pudo registrar el comprobante. Intentá nuevamente." }, { status: 400 });
  }
  // Reload the workspace so its session stores include the newly registered document.
  return redirectDocument(`/compras/${PURCHASE_DOCUMENTS[kind].path}`);
}

const control = "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900";
type Line = { key: number; idMateriaPrima: number; cantidad: number; precioUnitario: number };

export default function NewPurchaseDocument() {
  const { kind, purchases } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const busy = useNavigation().state !== "idle";
  const [supplierId, setSupplierId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [lines, setLines] = useState<Line[]>([{ key: 0, idMateriaPrima: 0, cantidad: 1, precioUnitario: 0 }]);
  const [nextKey, setNextKey] = useState(1);
  const [iva, setIva] = useState(0);
  const [fileError, setFileError] = useState("");
  const config = PURCHASE_DOCUMENTS[kind];
  const listUrl = `/compras/${config.path}`;
  const today = new Date().toLocaleDateString("en-CA");
  const invoice = purchases.COMPROBANTES_VENTA_PROVEEDOR.find(row => row.id === Number(invoiceId));
  const supplier = purchases.suppliers.proveedores.find(row => row.idPersona === invoice?.idProveedor);
  const balance = (row: (typeof purchases.COMPROBANTES_VENTA_PROVEEDOR)[number]) => Math.max(0, Math.round((getTotalComprobante(row) - purchases.RECIBOS_PAGO_PROVEEDOR.filter(receipt => receipt.idComprobanteVentaProveedor === row.id).reduce((sum, receipt) => sum + receipt.montoPagado, 0)) * 100) / 100);
  const net = lines.reduce((sum, line) => sum + Math.round(line.cantidad * line.precioUnitario * 100) / 100, 0);
  const update = (key: number, patch: Partial<Line>) => setLines(current => current.map(line => line.key === key ? { ...line, ...patch } : line));

  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <ModulePageHeader className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Subir {config.title}</h1><p className="mt-1 text-sm text-gray-500">Registrá los datos del comprobante recibido y adjuntá el archivo del proveedor.</p></ModulePageHeader>
    <Form method="post" encType="multipart/form-data" className="space-y-6" onSubmit={event => { if (fileError) event.preventDefault(); }}>
      {result?.error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{result.error}</p>}
      <fieldset disabled={busy} className="space-y-6 disabled:opacity-60">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Datos del comprobante</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kind === "recibo" ? <>
              <label className="text-sm font-medium">Factura del proveedor<select name="idComprobanteVentaProveedor" required value={invoiceId} onChange={event => setInvoiceId(event.target.value)} className={control}><option value="">Seleccionar factura</option>{purchases.COMPROBANTES_VENTA_PROVEEDOR.filter(row => balance(row) > 0).map(row => <option key={row.id} value={row.id}>{row.numero} · {purchases.suppliers.proveedores.find(supplier => supplier.idPersona === row.idProveedor)?.nombre} · Saldo {formatMoney(balance(row))}</option>)}</select></label>
              <div className="text-sm"><p className="font-medium">Proveedor</p><p className="mt-3">{supplier?.nombre ?? "Seleccioná una factura"}</p></div>
            </> : <label className="text-sm font-medium">Proveedor<select name="idProveedor" value={supplierId} onChange={event => setSupplierId(event.target.value)} required className={control}><option value="">Seleccionar proveedor</option>{purchases.suppliers.proveedores.map(row => <option key={row.idPersona} value={row.idPersona}>{row.nombre}</option>)}</select></label>}
            <label className="text-sm font-medium">Número del comprobante<input name="numero" required maxLength={80} placeholder="Número indicado por el proveedor" className={control} /></label>
            <label className="text-sm font-medium">Fecha de emisión<input type="date" name="fechaEmision" required defaultValue={today} className={control} /></label>
            {kind === "presupuesto" && <label className="text-sm font-medium">Fecha de vencimiento<input type="date" name="fechaVencimiento" required className={control} /></label>}
            {(kind === "factura" || kind === "remito") && <label className="text-sm font-medium">Orden de compra{kind === "remito" ? " (opcional)" : ""}<select key={supplierId} name="idOrdenCompraProveedor" required={kind === "factura"} className={control}><option value="">{kind === "remito" ? "Sin vincular" : "Seleccionar orden"}</option>{purchases.orders.filter(row => row.idProveedor === Number(supplierId)).map(row => <option key={row.id} value={row.id}>{row.numero}</option>)}</select></label>}
            {(kind === "factura" || kind === "recibo") && <label className="text-sm font-medium">Punto de venta<input name="puntoVenta" required maxLength={5} pattern="[0-9]{1,5}" inputMode="numeric" placeholder="00001" className={control} /></label>}
            {kind === "factura" && <>
              <label className="text-sm font-medium">CAE<input name="cae" maxLength={14} pattern="[0-9]{14}" inputMode="numeric" className={control} /></label>
              <label className="text-sm font-medium">Importe de IVA<input type="number" name="importeIVA" min="0" step="0.01" required value={iva} onChange={event => setIva(Number(event.target.value))} className={control} /></label>
            </>}
            {kind === "recibo" && <>
              <label className="text-sm font-medium">Medio de pago<select name="idMedioPago" required className={control}><option value="">Seleccionar medio de pago</option>{MEDIOS_PAGO.map(method => <option key={method.id} value={method.id}>{method.tipo}</option>)}</select></label>
              <label className="text-sm font-medium">Monto abonado<input type="number" name="montoPagado" min="0.01" max={invoice ? balance(invoice) : undefined} step="0.01" required className={control} />{invoice && <span className="mt-1 block text-xs text-gray-500">Saldo pendiente: {formatMoney(balance(invoice))}</span>}</label>
            </>}
          </div>
        </section>
        {kind !== "recibo" && <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Detalle de materias primas</h2>
          <input type="hidden" name="detalle" value={JSON.stringify(lines.map(({ key, ...line }) => line))} />
          <div className="space-y-3">{lines.map(line => <div key={line.key} className="grid items-end gap-3 rounded-lg bg-gray-50 p-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-medium">Materia prima<select required value={line.idMateriaPrima || ""} onChange={event => update(line.key, { idMateriaPrima: Number(event.target.value) })} className={control}><option value="">Seleccionar materia prima</option>{purchases.MATERIAS_PRIMAS.filter(product => product.id === line.idMateriaPrima || !lines.some(other => other.idMateriaPrima === product.id)).map(product => <option key={product.id} value={product.id}>{product.nombre}</option>)}</select></label>
            <label className="text-sm font-medium">Cantidad<input type="number" required min="0.001" step="0.001" value={line.cantidad} onChange={event => update(line.key, { cantidad: Number(event.target.value) })} className={control} /></label>
            {kind !== "remito" && <label className="text-sm font-medium">Precio unitario<input type="number" required min="0.01" step="0.01" value={line.precioUnitario} onChange={event => update(line.key, { precioUnitario: Number(event.target.value) })} className={control} /></label>}
            <div className="flex items-center justify-between gap-3 py-2">{kind !== "remito" && <span className="text-sm">{formatMoney(Math.round(line.cantidad * line.precioUnitario * 100) / 100)}</span>}<button type="button" disabled={lines.length === 1} onClick={() => setLines(current => current.filter(row => row.key !== line.key))} className="text-sm text-rose-700 underline disabled:opacity-40" aria-label={`Quitar línea ${lines.indexOf(line) + 1}`}>Quitar</button></div>
          </div>)}</div>
          <button type="button" className="mt-4 text-sm font-semibold text-amber-800 underline" onClick={() => { setLines(current => [...current, { key: nextKey, idMateriaPrima: 0, cantidad: 1, precioUnitario: 0 }]); setNextKey(current => current + 1); }}>Agregar materia prima</button>
          {kind !== "remito" && <p className="mt-4 text-right font-semibold">{kind === "factura" ? `Neto: ${formatMoney(net)} · IVA: ${formatMoney(iva)} · ` : ""}Total: {formatMoney(net + (kind === "factura" ? iva : 0))}</p>}
        </section>}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Archivo del proveedor</h2>
          <label className="mt-3 block text-sm font-medium">Adjuntar comprobante<input type="file" name="file" required accept={ATTACHMENT_ACCEPT} className={`${control} file:mr-4 file:rounded-lg file:border-0 file:bg-amber-50 file:px-3 file:py-2 file:text-amber-800`} onChange={event => { const file = event.target.files?.[0]; const message = file && file.size > MAX_ATTACHMENT_SIZE ? "El archivo debe pesar hasta 10 MB." : file && !file.size ? "Seleccioná un archivo con contenido." : ""; setFileError(message); event.target.setCustomValidity(message); }} /></label>
          <p className="mt-2 text-sm text-gray-500">PDF, JPG, PNG o WebP. Máximo 10 MB.</p>
          {fileError && <p role="alert" className="mt-2 text-sm text-rose-700">{fileError}</p>}
        </section>
        <div className="flex justify-end gap-3"><Link to={listUrl} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium">Cancelar</Link><button type="submit" className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800">{busy ? "Guardando…" : "Guardar comprobante"}</button></div>
      </fieldset>
    </Form>
  </div>;
}
