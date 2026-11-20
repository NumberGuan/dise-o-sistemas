import PrintVoucher from "~/components/PrintVoucher";
import BackToListButton from "~/components/BackToListButton";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { SalesFormHeader, SalesPageHeader, SalesListPanel, SalesEmptyState } from "~/components/SalesLayout";
import {
  CUSTOMER_RETURN_STATUSES,
  SAMPLE_CLIENTS,
  SAMPLE_CUSTOMER_RETURNS,
  SAMPLE_INVOICES,
  SAMPLE_ORDERS,
  SAMPLE_REMITS,
  getRegisteredReturnedQuantity,
  getRemitAvailableQuantity,
  type CustomerReturn,
  type CustomerReturnItem,
  type CustomerReturnStatus,
  type Remit,
} from "~/data/sales";

function getStatusClass(status: CustomerReturnStatus) {
  switch (status) {
    case "Borrador": return "bg-gray-100 text-gray-800";
    case "Registrada": return "bg-emerald-100 text-emerald-800";
    case "Anulada": return "bg-red-100 text-red-800";
  }
}

function getInvoiceForOrder(orderId: string) {
  return SAMPLE_INVOICES.find(invoice => invoice.orderId === orderId && invoice.status !== "Anulado");
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);
}

function hasAvailableItems(remit: Remit, excludingReturnId?: string) {
  return remit.items.some(item => getRemitAvailableQuantity(remit, item.productId, excludingReturnId) > 0);
}

function validateCustomerReturn(customerReturn: CustomerReturn) {
  const remit = SAMPLE_REMITS.find(candidate => candidate.id === customerReturn.remitId);
  if (!remit) return "Seleccioná un remito válido.";
  if (remit.status === "Anulado") return "El remito seleccionado está anulado y no admite devoluciones.";
  if (remit.status !== "Entregado") return "Solo se puede devolver mercadería de un remito entregado.";
  if (customerReturn.clientId !== remit.clientId) return "El cliente no coincide con el remito seleccionado.";
  if (customerReturn.orderId !== remit.orderId) return "El pedido no coincide con el remito seleccionado.";
  if (!customerReturn.date) return "Seleccioná la fecha de la devolución.";
  if (!customerReturn.reason.trim()) return "Indicá el motivo general de la devolución.";
  if (customerReturn.items.length === 0) return "Ingresá una cantidad mayor que cero para al menos un producto.";

  const seenProducts = new Set<string>();
  for (const item of customerReturn.items) {
    const remitItem = remit.items.find(candidate => candidate.productId === item.productId);
    if (!remitItem) return `El producto ${item.productName} no pertenece al remito seleccionado.`;
    if (seenProducts.has(item.productId)) return `El producto ${item.productName} está repetido en la devolución.`;
    seenProducts.add(item.productId);
    if (!Number.isFinite(item.quantity) || !Number.isInteger(item.quantity) || item.quantity <= 0) return `La cantidad de ${item.productName} debe ser un número entero mayor que cero.`;
    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) return `El precio original de ${item.productName} no es válido.`;
    if (Math.round(item.subtotal * 100) !== Math.round(item.quantity * item.unitPrice * 100)) return `El subtotal de ${item.productName} no coincide con su cantidad y precio original.`;
    if (item.quantity > remitItem.quantity) return `La cantidad de ${item.productName} supera las ${remitItem.quantity} unidades entregadas.`;
    const previouslyReturned = getRegisteredReturnedQuantity(remit.id, item.productId, customerReturn.id);
    const available = Math.max(0, remitItem.quantity - previouslyReturned);
    if (item.quantity > available) return `Solo quedan ${available} unidades de ${item.productName} disponibles para devolver.`;
  }
  const calculatedTotal = customerReturn.items.reduce((total, item) => total + item.subtotal, 0);
  if (Math.round(calculatedTotal * 100) !== Math.round(customerReturn.estimatedRefundTotal * 100)) return "El saldo estimado no coincide con los productos devueltos.";
  return null;
}

type ReturnFormProps = {
  customerReturn: CustomerReturn | null;
  initialRemitId: string;
  onCancel: () => void;
  onSave: (customerReturn: CustomerReturn) => void;
};

function ReturnForm({ customerReturn, initialRemitId, onCancel, onSave }: ReturnFormProps) {
  const isNew = !customerReturn;
  const [remitId, setRemitId] = useState(customerReturn?.remitId || initialRemitId);
  const [date, setDate] = useState(customerReturn?.date || new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState(customerReturn?.reason || "");
  const [observations, setObservations] = useState(customerReturn?.observations || "");
  const [quantities, setQuantities] = useState<Record<string, string>>(() => Object.fromEntries(customerReturn?.items.map(item => [item.productId, String(item.quantity)]) || []));
  const [error, setError] = useState("");

  const availableRemits = SAMPLE_REMITS.filter(remit => remit.status === "Entregado" && hasAvailableItems(remit, customerReturn?.id));
  const selectedRemit = SAMPLE_REMITS.find(remit => remit.id === remitId);
  const selectedClient = SAMPLE_CLIENTS.find(client => client.id === selectedRemit?.clientId);
  const selectedOrder = SAMPLE_ORDERS.find(order => order.id === selectedRemit?.orderId);
  const selectedInvoice = selectedOrder ? getInvoiceForOrder(selectedOrder.id) : undefined;
  const pricingItems = selectedInvoice?.items || selectedOrder?.items || [];
  const estimatedRefundAmount = selectedRemit?.items.reduce((total, item) => {
    const quantity = Number(quantities[item.productId] || 0);
    const unitPrice = pricingItems.find(priceItem => priceItem.productId === item.productId)?.unitPrice || 0;
    return total + (Number.isFinite(quantity) && quantity > 0 ? quantity * unitPrice : 0);
  }, 0) || 0;

  useEffect(() => {
    if (isNew && remitId && !availableRemits.some(remit => remit.id === remitId)) setError("El remito solicitado no está entregado o ya no tiene cantidades disponibles para devolver.");
  }, []);

  function selectRemit(nextRemitId: string) {
    setRemitId(nextRemitId);
    setQuantities({});
    setError("");
  }

  function handleSubmit(status: CustomerReturnStatus) {
    if (!remitId || !selectedRemit) return setError("Seleccioná un remito entregado.");
    if (isNew && !availableRemits.some(remit => remit.id === remitId)) return setError("El remito debe estar entregado y tener cantidades disponibles para devolver.");
    if (!selectedClient || !selectedOrder) return setError("El remito debe conservar un cliente y un pedido válidos.");
    const invalidItem = selectedRemit.items.find(item => {
      const raw = quantities[item.productId];
      if (raw === undefined || raw.trim() === "" || raw === "0") return false;
      const quantity = Number(raw);
      return !Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity < 0;
    });
    if (invalidItem) return setError(`La cantidad de ${invalidItem.productName} debe ser un número entero mayor o igual a cero.`);

    const items: CustomerReturnItem[] = selectedRemit.items.flatMap(item => {
      const quantity = Number(quantities[item.productId] || 0);
      if (quantity <= 0) return [];
      const previouslyReturnedQuantity = getRegisteredReturnedQuantity(selectedRemit.id, item.productId, customerReturn?.id);
      const unitPrice = pricingItems.find(priceItem => priceItem.productId === item.productId)?.unitPrice || 0;
      return [{
        id: customerReturn?.items.find(detail => detail.productId === item.productId)?.id || `rdi-${Date.now()}-${item.productId}`,
        productId: item.productId,
        productName: item.productName,
        deliveredQuantity: item.quantity,
        previouslyReturnedQuantity,
        availableQuantity: Math.max(0, item.quantity - previouslyReturnedQuantity),
        quantity,
        unitPrice,
        subtotal: Math.round(quantity * unitPrice * 100) / 100,
      }];
    });
    const nextSequence = Math.max(0, ...SAMPLE_CUSTOMER_RETURNS.map(existing => Number(existing.number.match(/(\d+)$/)?.[1]) || 0)) + 1;
    const nextReturn: CustomerReturn = {
      id: customerReturn?.id || `ret-${Date.now()}`,
      number: customerReturn?.number || `DV-0001-${String(nextSequence).padStart(8, "0")}`,
      date,
      clientId: selectedRemit.clientId,
      remitId: selectedRemit.id,
      orderId: selectedRemit.orderId,
      invoiceId: selectedInvoice?.id,
      items,
      reason: reason.trim(),
      observations: observations.trim(),
      estimatedRefundTotal: Math.round(estimatedRefundAmount * 100) / 100,
      status,
    };
    const validationError = validateCustomerReturn(nextReturn);
    if (validationError) return setError(validationError);
    onSave(nextReturn);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <SalesFormHeader title={isNew ? "Nueva devolución" : `Editar ${customerReturn.number}`} onCancel={onCancel} />
      {error && <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      <form noValidate className="space-y-6" onSubmit={event => event.preventDefault()}>
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4"><h2 className="font-semibold">Operación original</h2></div>
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <div>
              <label htmlFor="return-remit" className="block text-sm font-medium text-gray-700">Remito entregado *</label>
              <select required id="return-remit" value={remitId} onChange={event => selectRemit(event.target.value)} disabled={!isNew} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-gray-100">
                <option value="">Seleccionar remito...</option>
                {availableRemits.map(remit => {
                  const client = SAMPLE_CLIENTS.find(candidate => candidate.id === remit.clientId);
                  return <option key={remit.id} value={remit.id}>{remit.number} · {client?.name} · {remit.date}</option>;
                })}
                {!isNew && selectedRemit && !availableRemits.some(remit => remit.id === selectedRemit.id) && <option value={selectedRemit.id}>{selectedRemit.number}</option>}
              </select>
              {availableRemits.length === 0 && isNew && <p className="mt-2 text-xs text-gray-600">No hay remitos entregados con unidades disponibles.</p>}
            </div>
            <div><label htmlFor="return-date" className="block text-sm font-medium text-gray-700">Fecha *</label><input required id="return-date" type="date" value={date} onChange={event => setDate(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" /></div>
            {selectedRemit && <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm sm:col-span-2"><dl className="grid gap-3 sm:grid-cols-4"><div><dt className="text-gray-500">Cliente</dt><dd className="font-medium">{selectedClient?.name || "No disponible"}</dd></div><div><dt className="text-gray-500">Pedido</dt><dd className="font-medium">{selectedOrder?.number || "No disponible"}</dd></div><div><dt className="text-gray-500">Comprobante</dt><dd className="font-medium">{selectedInvoice?.number || "Sin comprobante"}</dd></div><div><dt className="text-gray-500">Fecha de entrega</dt><dd className="font-medium">{selectedRemit.date}</dd></div></dl></div>}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4"><h2 className="font-semibold">Productos devueltos</h2><p className="mt-1 text-xs text-gray-600">Ingresá 0 para los productos que no se devuelven en esta operación.</p></div>
          {!selectedRemit ? <p className="p-5 text-sm text-gray-600">Seleccioná un remito para cargar sus productos.</p> : <><div className="overflow-x-auto"><table className="w-full min-w-[940px] text-left text-sm"><thead className="bg-gray-50 text-gray-700"><tr><th className="px-4 py-3 font-medium">Producto</th><th className="px-4 py-3 text-right font-medium">Precio unitario</th><th className="px-4 py-3 text-right font-medium">Entregada</th><th className="px-4 py-3 text-right font-medium">Devuelta antes</th><th className="px-4 py-3 text-right font-medium">Disponible</th><th className="px-4 py-3 text-right font-medium">A devolver</th><th className="px-4 py-3 text-right font-medium">Subtotal</th></tr></thead><tbody className="divide-y divide-gray-100">{selectedRemit.items.map(item => {
            const previouslyReturned = getRegisteredReturnedQuantity(selectedRemit.id, item.productId, customerReturn?.id);
            const available = Math.max(0, item.quantity - previouslyReturned);
            const unitPrice = pricingItems.find(priceItem => priceItem.productId === item.productId)?.unitPrice || 0;
            const returnQuantity = Number(quantities[item.productId] || 0);
            const lineSubtotal = Number.isFinite(returnQuantity) && returnQuantity > 0 ? returnQuantity * unitPrice : 0;
            return <tr key={item.productId}><td className="px-4 py-3 font-medium text-gray-900">{item.productName}</td><td className="px-4 py-3 text-right">{formatCurrency(unitPrice)}</td><td className="px-4 py-3 text-right">{item.quantity}</td><td className="px-4 py-3 text-right">{previouslyReturned}</td><td className="px-4 py-3 text-right font-semibold text-emerald-700">{available}</td><td className="px-4 py-3 text-right"><input aria-label={`Cantidad a devolver de ${item.productName}`} type="number" min="0" max={available} step="1" value={quantities[item.productId] ?? "0"} onChange={event => setQuantities(current => ({ ...current, [item.productId]: event.target.value }))} className="w-24 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-right font-semibold text-gray-950 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" /></td><td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(lineSubtotal)}</td></tr>;
          })}</tbody></table></div><div className="border-t border-gray-200 bg-emerald-50 px-5 py-4 text-right"><p className="text-sm text-emerald-800">Saldo estimado a devolver</p><p className="mt-1 text-2xl font-bold text-emerald-900">{formatCurrency(estimatedRefundAmount)}</p><p className="mt-1 text-xs text-emerald-800">Suma de cantidad devuelta × precio unitario original. No distribuye descuentos ni IVA.</p></div></>}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><div className="grid gap-5"><div><label htmlFor="return-reason" className="block text-sm font-medium text-gray-700">Motivo general *</label><input required id="return-reason" value={reason} onChange={event => setReason(event.target.value)} placeholder="Ej.: producto dañado, error en la entrega" className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm placeholder:text-gray-500 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" /></div><div><label htmlFor="return-observations" className="block text-sm font-medium text-gray-700">Observaciones</label><textarea id="return-observations" rows={3} value={observations} onChange={event => setObservations(event.target.value)} placeholder="Detalles adicionales de la devolución" className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm placeholder:text-gray-500 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" /></div></div></section>
        <aside className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">Esta maqueta no modifica stock, saldos, pagos ni genera notas de crédito automáticamente.</aside>
        <div className="flex flex-wrap justify-end gap-3"><button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancelar</button><button type="button" data-validate-form onClick={() => handleSubmit("Borrador")} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50">Guardar borrador</button><button type="button" data-validate-form onClick={() => handleSubmit("Registrada")} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700">Registrar devolución</button></div>
      </form>
    </div>
  );
}

type ReturnDetailProps = { customerReturn: CustomerReturn; notice: string; onClose: () => void; onEdit: () => void; onChangeStatus: (status: CustomerReturnStatus) => void };

function ReturnDetail({ customerReturn, notice, onClose, onEdit, onChangeStatus }: ReturnDetailProps) {
  const client = SAMPLE_CLIENTS.find(candidate => candidate.id === customerReturn.clientId);
  const remit = SAMPLE_REMITS.find(candidate => candidate.id === customerReturn.remitId);
  const order = SAMPLE_ORDERS.find(candidate => candidate.id === customerReturn.orderId);
  const invoice = SAMPLE_INVOICES.find(candidate => candidate.id === customerReturn.invoiceId);
  const totalUnits = customerReturn.items.reduce((total, item) => total + item.quantity, 0);
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <div className="sticky top-16 z-30 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 py-3"><h1 className="break-all text-2xl font-bold">Devolución {customerReturn.number}</h1><div className="flex flex-wrap items-center gap-2"><BackToListButton onClick={onClose} /><PrintVoucher title={"Devolución"} document={{ ...customerReturn, total: customerReturn.estimatedRefundTotal }} client={client} totalLabel="Reintegro estimado" signature details={[{ label: "Motivo", value: customerReturn.reason }, { label: "Remito", value: remit?.number ?? customerReturn.remitId }, { label: "Factura", value: invoice?.number ?? "Sin comprobante" }]} /></div></div>
      {notice && <p role="status" className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p>}
      <div className="grid gap-6 lg:grid-cols-3"><div className="min-w-0 space-y-6 lg:col-span-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="mb-4 font-semibold">Productos devueltos</h2><div className="overflow-x-auto rounded-lg border border-gray-200"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-gray-50 text-gray-700"><tr><th className="px-4 py-2 font-medium">Producto</th><th className="px-4 py-2 text-right font-medium">Entregada</th><th className="px-4 py-2 text-right font-medium">Devuelta antes</th><th className="px-4 py-2 text-right font-medium">En esta devolución</th><th className="px-4 py-2 text-right font-medium">Precio unitario</th><th className="px-4 py-2 text-right font-medium">Subtotal</th></tr></thead><tbody className="divide-y divide-gray-100">{customerReturn.items.map(item => <tr key={item.id}><td className="px-4 py-3 font-medium">{item.productName}</td><td className="px-4 py-3 text-right">{item.deliveredQuantity}</td><td className="px-4 py-3 text-right">{item.previouslyReturnedQuantity}</td><td className="px-4 py-3 text-right font-semibold">{item.quantity}</td><td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td><td className="px-4 py-3 text-right font-semibold">{formatCurrency(item.subtotal)}</td></tr>)}</tbody></table></div><div className="mt-4 flex flex-wrap items-end justify-between gap-3"><p className="text-sm font-semibold">Total: {totalUnits} {totalUnits === 1 ? "unidad" : "unidades"}</p><div className="text-right"><p className="text-sm text-emerald-800">Saldo estimado a devolver</p><p className="text-xl font-bold text-emerald-900">{formatCurrency(customerReturn.estimatedRefundTotal)}</p></div></div></section>
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Motivo</h2><p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{customerReturn.reason}</p>{customerReturn.observations && <><h3 className="mt-5 border-t border-gray-100 pt-4 text-sm font-semibold">Observaciones</h3><p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{customerReturn.observations}</p></>}</section>
        <aside className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">Sin impacto automático sobre stock, comprobantes, pagos o saldos.</aside>
      </div><div className="min-w-0 space-y-6">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="mb-4 font-semibold">Información general</h2><dl className="space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-gray-500">Estado</dt><dd><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(customerReturn.status)}`}>{customerReturn.status}</span></dd></div><div className="flex justify-between gap-3"><dt className="text-gray-500">Fecha</dt><dd className="font-medium">{customerReturn.date}</dd></div><div className="flex justify-between gap-3"><dt className="text-gray-500">Cliente</dt><dd className="text-right font-medium">{client?.name || "No disponible"}</dd></div><div className="flex justify-between gap-3 border-t border-gray-100 pt-3"><dt className="text-gray-500">Remito</dt><dd className="text-right font-medium text-amber-800"><Link className="underline underline-offset-2" to={`/ventas/remitos?remito=${encodeURIComponent(customerReturn.remitId)}`}>{remit?.number || customerReturn.remitId}</Link></dd></div><div className="flex justify-between gap-3"><dt className="text-gray-500">Pedido</dt><dd className="text-right font-medium text-amber-800"><Link className="underline underline-offset-2" to={`/ventas/pedidos?pedido=${encodeURIComponent(customerReturn.orderId)}`}>{order?.number || customerReturn.orderId}</Link></dd></div><div className="flex justify-between gap-3"><dt className="text-gray-500">Comprobante</dt><dd className="text-right font-medium">{invoice ? <Link className="text-amber-800 underline underline-offset-2" to={`/ventas/comprobantes?comprobante=${encodeURIComponent(invoice.id)}`}>{invoice.number}</Link> : "Sin comprobante"}</dd></div></dl></section>
        <section className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-5">{customerReturn.status === "Borrador" && <><button type="button" onClick={() => onChangeStatus("Registrada")} className="w-full rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Registrar devolución</button><button type="button" onClick={onEdit} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Editar devolución</button></>}{customerReturn.status !== "Anulada" && <button type="button" onClick={() => { if (confirm("¿Estás seguro de anular esta devolución? Las cantidades registradas volverán a quedar disponibles.")) onChangeStatus("Anulada"); }} className="w-full rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">Anular devolución</button>}</section>
      </div></div>
    </div>
  );
}

export default function Devoluciones() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [returns, setReturns] = useState<CustomerReturn[]>(() => [...SAMPLE_CUSTOMER_RETURNS]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos los estados");
  const [notice, setNotice] = useState("");
  const [editingReturn, setEditingReturn] = useState<CustomerReturn | null | undefined>(undefined);
  const [selectedReturn, setSelectedReturn] = useState<CustomerReturn | null>(null);
  const requestedRemitId = searchParams.get("remito") || "";
  const requestedReturnId = searchParams.get("devolucion") || "";

  useEffect(() => {
    if (requestedReturnId) {
      const requested = SAMPLE_CUSTOMER_RETURNS.find(customerReturn => customerReturn.id === requestedReturnId);
      if (requested) setSelectedReturn(requested);
    } else if (requestedRemitId) {
      const requestedRemit = SAMPLE_REMITS.find(remit => remit.id === requestedRemitId);
      const existing = SAMPLE_CUSTOMER_RETURNS.filter(customerReturn => customerReturn.remitId === requestedRemitId);
      if (requestedRemit?.status === "Entregado" && hasAvailableItems(requestedRemit)) setEditingReturn(null);
      else if (existing[0]) setSelectedReturn(existing[0]);
      else setNotice("El remito solicitado no admite una devolución: debe estar entregado y tener unidades disponibles.");
    }
  }, [requestedRemitId, requestedReturnId]);

  const filteredReturns = useMemo(() => returns.filter(customerReturn => {
    const client = SAMPLE_CLIENTS.find(candidate => candidate.id === customerReturn.clientId);
    const remit = SAMPLE_REMITS.find(candidate => candidate.id === customerReturn.remitId);
    const order = SAMPLE_ORDERS.find(candidate => candidate.id === customerReturn.orderId);
    const invoice = SAMPLE_INVOICES.find(candidate => candidate.id === customerReturn.invoiceId);
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [customerReturn.number, client?.name, remit?.number, order?.number, invoice?.number].some(value => value?.toLowerCase().includes(query));
    return matchesSearch && (statusFilter === "Todos los estados" || customerReturn.status === statusFilter);
  }), [returns, search, statusFilter]);

  function clearNavigation() {
    if (!requestedRemitId && !requestedReturnId) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("remito");
    nextParams.delete("devolucion");
    setSearchParams(nextParams, { replace: true });
  }
  function closeForm() { setEditingReturn(undefined); clearNavigation(); }
  function closeDetail() { setSelectedReturn(null); clearNavigation(); }

  useEffect(() => {
    if (editingReturn === undefined && selectedReturn === null) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (editingReturn !== undefined) closeForm();
        if (selectedReturn) closeDetail();
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editingReturn, selectedReturn]);

  function saveReturn(nextReturn: CustomerReturn) {
    const previous = SAMPLE_CUSTOMER_RETURNS.find(existing => existing.id === nextReturn.id);
    if (previous && previous.status !== "Borrador") { setNotice("Solo las devoluciones en borrador pueden modificarse o registrarse."); return; }
    if (SAMPLE_CUSTOMER_RETURNS.some(existing => existing.number === nextReturn.number && existing.id !== nextReturn.id)) { setNotice("Ya existe una devolución con ese número."); return; }
    const validationError = validateCustomerReturn(nextReturn);
    if (validationError) { setNotice(validationError); return; }
    if (previous) SAMPLE_CUSTOMER_RETURNS[SAMPLE_CUSTOMER_RETURNS.findIndex(existing => existing.id === nextReturn.id)] = nextReturn;
    else SAMPLE_CUSTOMER_RETURNS.unshift(nextReturn);
    setReturns([...SAMPLE_CUSTOMER_RETURNS]);
    setNotice(nextReturn.status === "Registrada" ? "Devolución registrada en memoria; las cantidades disponibles se recalcularon para esta sesión." : "Borrador guardado en memoria; no descuenta cantidades y se pierde al recargar la aplicación.");
    setEditingReturn(undefined);
    clearNavigation();
    setSelectedReturn(nextReturn);
  }

  function changeStatus(status: CustomerReturnStatus) {
    if (!selectedReturn) return;
    const validTransition = (selectedReturn.status === "Borrador" && (status === "Registrada" || status === "Anulada")) || (selectedReturn.status === "Registrada" && status === "Anulada");
    if (!validTransition) { setNotice(`No se puede cambiar una devolución ${selectedReturn.status.toLowerCase()} a ${status.toLowerCase()}.`); return; }
    const updated = { ...selectedReturn, status };
    if (status === "Registrada") {
      const validationError = validateCustomerReturn(updated);
      if (validationError) { setNotice(validationError); return; }
    }
    const index = SAMPLE_CUSTOMER_RETURNS.findIndex(existing => existing.id === updated.id);
    if (index < 0) { setNotice("No se encontró la devolución que intentás actualizar."); return; }
    SAMPLE_CUSTOMER_RETURNS[index] = updated;
    setReturns([...SAMPLE_CUSTOMER_RETURNS]);
    setSelectedReturn(updated);
    setNotice(status === "Anulada" ? "Devolución anulada; sus unidades volvieron a estar disponibles durante esta sesión." : "Devolución registrada; sus unidades ya descuentan la disponibilidad durante esta sesión.");
  }

  if (editingReturn !== undefined) return <ReturnForm customerReturn={editingReturn} initialRemitId={requestedRemitId} onCancel={closeForm} onSave={saveReturn} />;
  if (selectedReturn) return <ReturnDetail customerReturn={selectedReturn} notice={notice} onClose={closeDetail} onEdit={() => setEditingReturn(selectedReturn)} onChangeStatus={changeStatus} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <SalesPageHeader title="Devoluciones de Clientes" description="Registro trazable de mercadería devuelta a partir de remitos entregados." action={<button type="button" onClick={() => { setNotice(""); setEditingReturn(null); }} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">+ Nueva devolución</button>} />
      {notice && <p role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
      <SalesListPanel
        title="Listado de devoluciones"
        summary={`${filteredReturns.length} ${filteredReturns.length === 1 ? "devolución encontrada" : "devoluciones encontradas"}`}
        filters={<>
          <label className="sr-only" htmlFor="return-search">Buscar devoluciones</label>
          <input id="return-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Número, cliente, pedido, remito..." className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 lg:w-64" />
          <label className="sr-only" htmlFor="return-status-filter">Filtrar devoluciones por estado</label>
          <select id="return-status-filter" value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100">
            <option>Todos los estados</option>
            {CUSTOMER_RETURN_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
        </>}
      >
        {filteredReturns.length === 0 ? <SalesEmptyState entity="devoluciones" onReset={() => { setSearch(""); setStatusFilter("Todos los estados"); }} /> : <><div className="hidden items-center gap-4 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 xl:grid xl:grid-cols-7"><div className="text-center">Número / Fecha</div><div className="text-center">Cliente</div><div className="text-center">Remito</div><div className="text-center">Pedido / Comprobante</div><div className="text-center">Unidades</div><div className="text-center">Estado</div><div className="text-center">Acciones</div></div><div className="divide-y divide-gray-100">{filteredReturns.map(customerReturn => {
          const client = SAMPLE_CLIENTS.find(candidate => candidate.id === customerReturn.clientId);
          const remit = SAMPLE_REMITS.find(candidate => candidate.id === customerReturn.remitId);
          const order = SAMPLE_ORDERS.find(candidate => candidate.id === customerReturn.orderId);
          const invoice = SAMPLE_INVOICES.find(candidate => candidate.id === customerReturn.invoiceId);
          const total = customerReturn.items.reduce((sum, item) => sum + item.quantity, 0);
          return <article key={customerReturn.id} className="grid min-w-0 grid-cols-2 items-center gap-4 p-4 transition hover:bg-amber-50/30 xl:grid-cols-7 xl:px-5"><div className="min-w-0 xl:text-center"><p className="text-xs text-gray-500">{customerReturn.date}</p><p className="break-words font-semibold">{customerReturn.number}</p></div><div className="min-w-0 xl:text-center"><p className="text-xs text-gray-500 xl:hidden">Cliente</p><p className="break-words text-sm font-medium">{client?.name || "No disponible"}</p></div><div className="min-w-0 xl:text-center"><p className="text-xs text-gray-500 xl:hidden">Remito</p><p className="break-words text-sm">{remit?.number || customerReturn.remitId}</p></div><div className="min-w-0 xl:text-center"><p className="text-xs text-gray-500 xl:hidden">Pedido / Comprobante</p><p className="text-sm font-medium">{order?.number || customerReturn.orderId}</p><p className="break-words text-xs text-gray-600">{invoice?.number || "Sin comprobante"}</p></div><div className="xl:text-center"><p className="text-xs text-gray-500 xl:hidden">Unidades</p><p className="text-sm font-semibold">{total}</p></div><div className="xl:text-center"><p className="text-xs text-gray-500 xl:hidden">Estado</p><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(customerReturn.status)}`}>{customerReturn.status}</span></div><div className="col-span-2 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-3 xl:col-span-1 xl:justify-center xl:border-0 xl:pt-0"><button type="button" onClick={() => { setNotice(""); setSelectedReturn(customerReturn); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-600">Ver detalle</button>{customerReturn.status === "Borrador" && <button type="button" onClick={() => setEditingReturn(customerReturn)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-amber-600">Editar</button>}</div></article>;
        })}</div></>}
      </SalesListPanel>
    </div>
  );
}
