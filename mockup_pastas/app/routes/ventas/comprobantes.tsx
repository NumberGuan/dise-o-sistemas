import { invoiceAmounts } from "~/data/billing";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useLoaderData, useFetcher } from "react-router";
import { SalesFormHeader, SalesPageHeader } from "~/components/SalesLayout";
import {
  INVOICE_STATUSES,
  INVOICE_TYPES,
  getInvoicePaymentSummary,
  type Receipt,
  type Invoice,
  type InvoiceStatus,
  type InvoiceItem,
  type InvoiceType
} from "~/data/sales";

import { getSalesData } from "~/data/sales.server";
import { saveSalesInvoice } from "~/data/billing.server";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/comprobantes";

export const loader = async ({ request }: Route.LoaderArgs) => {
  await requireUserAndRole(request, ["Ventas"]);
  return getSalesData();
};

export const action = async ({ request }: Route.ActionArgs) => {
  await requireUserAndRole(request, ["Ventas"]);
  try {
    const data = await request.formData();
    const raw = data.get("document");
    const id = data.get("id");
    if (typeof raw !== "string" || raw.length > 200000 || (id !== null && (typeof id !== "string" || id.length > 120))) throw new Error("Los datos enviados no son validos.");
    await saveSalesInvoice(JSON.parse(raw), typeof id === "string" ? id : undefined);
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo guardar el documento." };
  }
};

function getStatusClass(status: InvoiceStatus) {
  switch (status) {
    case "Borrador": return "bg-gray-100 text-gray-800";
    case "Emitido": return "bg-emerald-100 text-emerald-800";
    case "Anulado": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);
}

function getPaymentStatus(invoice: Invoice, receipts: Receipt[]) {
  const { paid, balance } = getInvoicePaymentSummary(invoice, undefined, receipts);
  return balance === 0 ? "Pagado" : paid > 0 ? "Pago parcial" : "Pendiente";
}

type InvoiceFormProps = {
  invoice: Invoice | null;
  invoices: Invoice[];
  initialOrderId?: string;
  onCancel: () => void;
  onSave: (inv: Invoice) => void;
};

function InvoiceForm({ invoice, invoices, initialOrderId, onCancel, onSave }: InvoiceFormProps) {
  const { clients, orders } = useLoaderData<typeof loader>();
  const initialOrder = orders.find(order => order.id === (invoice?.orderId || initialOrderId));
  const isNew = !invoice;
  const [orderId, setOrderId] = useState(invoice?.orderId || initialOrder?.id || "");
  const [clientId, setClientId] = useState(invoice?.clientId || initialOrder?.clientId || "");
  const [type, setType] = useState<InvoiceType>(invoice?.type || "Factura A");
  const [date, setDate] = useState(invoice?.date || new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(invoice?.dueDate || "");
  const [items, setItems] = useState<InvoiceItem[]>(invoice?.items || initialOrder?.items || []);
  const [orderDiscount, setOrderDiscount] = useState(invoice?.discount ?? initialOrder?.discount ?? 0);
  const [observations, setObservations] = useState(invoice?.observations || "");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (orderId) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setClientId(order.clientId);
        setItems(order.items.map(item => ({ ...item })));
        setOrderDiscount(order.discount);
      }
    } else if (!orderId && isNew) {
      setItems([]);
      setOrderDiscount(0);
    }
  }, [orderId, isNew, orders]);

  const selectedClient = clients.find(c => c.id === clientId);

  const amounts = invoiceAmounts(items, selectedClient?.type ?? "Particular", orderDiscount);
  const { subtotal, discount, taxableBase, tax, total } = amounts;

  const availableOrders = useMemo(() => {
    const invoicedOrderIds = new Set(invoices.filter(i => i.id !== invoice?.id && i.status !== "Anulado").map(i => i.orderId));
    return orders.filter(o => o.clientId === clientId && o.status !== "Cancelado" && !invoicedOrderIds.has(o.id));
  }, [clientId, invoice?.id, invoices, orders]);

  function handleSubmit(status: InvoiceStatus) {
    if (!orderId) return setErrorMsg("Selecciona un pedido para crear la factura.");
    if (!clientId) return setErrorMsg("El pedido seleccionado no tiene un cliente válido.");
    if (items.length === 0) return setErrorMsg("La factura debe tener al menos un renglón.");
    if (!dueDate) return setErrorMsg("Selecciona la fecha de vencimiento.");
    if (invoices.some(i => i.orderId === orderId && i.id !== invoice?.id && i.status !== "Anulado")) {
      return setErrorMsg("Ya existe una factura activa para este pedido.");
    }

    if (tax < 0) return setErrorMsg("El importe IVA no puede ser negativo.");
    const nextNumber = Math.max(0, ...invoices.map(existing => Number(existing.number.slice(-8)) || 0)) + 1;
    const number = isNew ? `FC-0001-${nextNumber.toString().padStart(8, "0")}` : invoice.number;

    onSave({
      id: isNew ? `inv-${Date.now()}` : invoice.id,
      number,
      type,
      date,
      dueDate,
      clientId,
      orderId: orderId || undefined,
      items: amounts.items,
      commercialDiscountRate: amounts.commercialDiscountRate,
      subtotal,
      discount,
      tax,
      total,
      status,
      observations,
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <SalesFormHeader title={isNew ? "Nueva Factura" : `Editar Factura ${invoice.number}`} onCancel={onCancel} />

      {errorMsg && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">
          {errorMsg}
        </div>
      )}

      

      <form className="space-y-8">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Datos principales</h2>
          </div>
          <div className="p-5">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="invoice-client" className="block text-sm font-medium text-gray-700">Cliente *</label>
                <select
                  id="invoice-client"
                  required
                  value={clientId}
                  onChange={e => {
                    const nextClientId = e.target.value;
                    setClientId(nextClientId);
                    if (orderId && orders.find(order => order.id === orderId)?.clientId !== nextClientId) {
                      setOrderId("");
                    }
                  }}
                  disabled={Boolean(orderId)}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-gray-50 disabled:text-gray-700"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {selectedClient && (
                  <p className="mt-2 text-xs text-gray-500">
                    {selectedClient.documentType}: {selectedClient.cuitCuil || "N/A"} - {selectedClient.ivaType}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="invoice-order" className="block text-sm font-medium text-gray-700">Pedido asociado</label>
                <select
                  id="invoice-order"
                  value={orderId}
                  onChange={e => setOrderId(e.target.value)}
                  disabled={!isNew}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-gray-50 disabled:text-gray-700"
                >
                  <option value="">Ninguno</option>
                  {orderId && !availableOrders.some(o => o.id === orderId) && (
                    <option value={orderId}>{orders.find(o => o.id === orderId)?.number ?? "Pedido asociado"}</option>
                  )}
                  {availableOrders.map(o => (
                    <option key={o.id} value={o.id}>{o.number} · {clients.find(c => c.id === o.clientId)?.name} · {formatCurrency(o.total)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="invoice-type" className="block text-sm font-medium text-gray-700">Tipo de comprobante</label>
                <select
                  id="invoice-type"
                  value={type}
                  onChange={e => setType(e.target.value as InvoiceType)}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                >
                  {INVOICE_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              

              <div>
                <label htmlFor="invoice-date" className="block text-sm font-medium text-gray-700">Fecha de emisión *</label>
                <input
                  id="invoice-date"
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <div>
                <label htmlFor="invoice-due-date" className="block text-sm font-medium text-gray-700">Vencimiento *</label>
                <input
                  id="invoice-due-date"
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Conceptos</h2>
          </div>
          <div className="p-5">
            {items.length === 0 ? (
              <p className="text-sm text-gray-500">No hay renglones en la factura. Selecciona un pedido para cargarlos automáticamente.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full min-w-[500px] text-left text-sm text-gray-900">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="px-4 py-2 font-medium">Producto</th>
                      <th className="px-4 py-2 text-right font-medium">Cant.</th>
                      <th className="px-4 py-2 text-right font-medium">Precio Uni.</th>
                      <th className="px-4 py-2 text-right font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map(item => (
                      <tr key={item.id} className="bg-white">
                        <td className="px-4 py-2">{item.productName}</td>
                        <td className="px-4 py-2 text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900">{formatCurrency(item.subtotal)}{amounts.commercialDiscountRate === 15 && <small className="block text-emerald-700">15%: -{formatCurrency(amounts.items.find(line => line.id === item.id)?.discount ?? 0)}</small>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <div className="w-full max-w-xs space-y-3 rounded-lg bg-gray-50 p-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{amounts.commercialDiscountRate === 15 ? "Descuento Comercio (15%)" : "Descuento"}</span>
                  <span>- {formatCurrency(discount)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3 text-sm font-medium text-gray-700">
                  <span>Base imponible</span>
                  <span>{formatCurrency(taxableBase)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <label htmlFor="taxInput" className="font-medium">Importe IVA (21 %)</label>
                    <div className="flex items-center gap-1">
                      <span>$</span>
                      <input 
                        id="taxInput"
                        type="number" 
                        min="0" 
                        step="0.01" 
                        value={tax} 
                        readOnly
                        aria-readonly="true"
                        className="w-28 rounded-md border border-gray-300 bg-gray-100 px-2 py-1 text-right text-sm font-semibold text-gray-900 outline-none"
                      />
                    </div>
                  </div>
                <p className="text-right text-xs text-gray-500">Calculado automáticamente como el 21 % de la base imponible.</p>
                <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="invoice-observations" className="block text-sm font-medium text-gray-700">Observaciones</label>
              <textarea
                id="invoice-observations"
                rows={2}
                value={observations}
                onChange={e => setObservations(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">Cancelar</button>
          <button type="button" onClick={() => handleSubmit("Borrador")} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50">Guardar como borrador</button>
          <button type="button" onClick={() => handleSubmit("Emitido")} className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-800">Emitir Factura</button>
        </div>
      </form>
    </div>
  );
}

type InvoiceDetailProps = {
  invoice: Invoice;
  onClose: () => void;
  onEdit: () => void;
  onStatusChange: (status: InvoiceStatus) => void;
};

function InvoiceDetail({ invoice, onClose, onEdit, onStatusChange }: InvoiceDetailProps) {
  const { clients, orders, receipts } = useLoaderData<typeof loader>();
  const client = clients.find(c => c.id === invoice.clientId);
  const order = orders.find(o => o.id === invoice.orderId);
  const payment = getInvoicePaymentSummary(invoice, undefined, receipts);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="min-w-0 break-words text-2xl font-bold text-gray-900">{invoice.type} {invoice.number}</h1>
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(invoice.status)}`}>
            {invoice.status}
          </span>
        </div>
        <button type="button" onClick={onClose} className="text-sm font-medium text-gray-500 hover:text-gray-700">Volver al listado</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Detalle de conceptos</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[500px] text-left text-sm text-gray-900">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-4 py-2 font-medium">Producto</th>
                    <th className="px-4 py-2 text-right font-medium">Cant.</th>
                    <th className="px-4 py-2 text-right font-medium">Precio Uni.</th>
                    <th className="px-4 py-2 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoice.items.map(item => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">{item.productName}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.subtotal)}{invoice.commercialDiscountRate === 15 && <small className="block text-emerald-700">15%: -{formatCurrency(item.discount ?? 0)}</small>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{invoice.commercialDiscountRate === 15 ? "Descuento Comercio (15%)" : "Descuento"}</span>
                    <span>- {formatCurrency(invoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Base imponible</span>
                  <span>{formatCurrency(Math.max(0, invoice.subtotal - invoice.discount))}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Importe IVA (21 %)</span>
                  <span>{formatCurrency(invoice.tax)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
                {invoice.status === "Emitido" && (
                  <>
                    <div className="flex justify-between text-sm text-gray-700"><span>Pagado</span><span>{formatCurrency(payment.paid)}</span></div>
                    <div className="flex justify-between text-sm font-semibold text-gray-900"><span>Saldo pendiente</span><span>{formatCurrency(payment.balance)}</span></div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Información</h2>
            <dl className="space-y-3 text-sm">
              {invoice.status === "Emitido" && (
                <div>
                  <dt className="text-gray-600">Estado de pago</dt>
                  <dd className="font-medium text-gray-900">{getPaymentStatus(invoice, receipts)}</dd>
                </div>
              )}
              <div className={invoice.status === "Emitido" ? "border-t border-gray-100 pt-3" : undefined}>
                <dt className="text-gray-500">Cliente</dt>
                <dd className="font-medium text-gray-900">{client?.name || "Desconocido"}</dd>
                <dd className="text-gray-600">{client?.documentType}: {client?.cuitCuil}</dd>
                <dd className="text-gray-600">{client?.ivaType}</dd>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <dt className="text-gray-500">Fecha de emisión</dt>
                <dd className="font-medium text-gray-900">{invoice.date}</dd>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <dt className="text-gray-500">Vencimiento</dt>
                <dd className="font-medium text-gray-900">{invoice.dueDate}</dd>
              </div>
              
              {order && (
                <div className="border-t border-gray-100 pt-3">
                  <dt className="text-gray-500">Pedido asociado</dt>
                  <dd className="font-medium text-amber-700">{order.number}</dd>
                </div>
              )}
              {invoice.observations && (
                <div className="border-t border-gray-100 pt-3">
                  <dt className="text-gray-500">Observaciones</dt>
                  <dd className="text-gray-900">{invoice.observations}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Acciones</h2>
            <div className="space-y-3">
              {invoice.status === "Borrador" && (
                <>
                  <button type="button" onClick={onEdit} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50">Editar borrador</button>
                  <button type="button" onClick={() => onStatusChange("Emitido")} className="w-full rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-800">Emitir</button>
                </>
              )}
              {invoice.status === "Emitido" && payment.paid === 0 && (
                <button type="button" onClick={() => { if(confirm("¿Estás seguro de anular esta factura?")) onStatusChange("Anulado"); }} className="w-full rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50">Anular factura</button>
              )}
              {invoice.status === "Emitido" && payment.paid > 0 && <p className="text-xs leading-5 text-gray-700">Para anular esta factura, primero anulá los recibos registrados.</p>}
              <p className="text-xs leading-5 text-gray-500">La descarga e impresión todavía no están disponibles.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Comprobantes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { invoices, clients, orders, receipts } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const serverError = fetcher.data && "error" in fetcher.data ? fetcher.data.error : "";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos los estados");
  const [typeFilter, setTypeFilter] = useState("Todos los tipos");

  const [editingInvoice, setEditingInvoice] = useState<Invoice | null | undefined>(undefined);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [notice, setNotice] = useState("");
  const requestedInvoiceId = searchParams.get("comprobante") || "";
  const requestedOrderId = searchParams.get("pedido") || "";

  useEffect(() => {
    if (!requestedOrderId || requestedInvoiceId) return;
    const order = orders.find(order => order.id === requestedOrderId);
    if (!order || order.status === "Cancelado") {
      setNotice("El pedido no está disponible para generar una factura.");
      return;
    }
    const existing = invoices.find(invoice => invoice.orderId === order.id && invoice.status !== "Anulado");
    if (existing) {
      setEditingInvoice(undefined);
      setSelectedInvoice(existing);
    } else {
      setSelectedInvoice(null);
      setEditingInvoice(null);
    }
  }, [requestedOrderId, requestedInvoiceId, orders, invoices]);

  useEffect(() => {
    if (!requestedInvoiceId) return;
    const requested = invoices.find(invoice => invoice.id === requestedInvoiceId);
    if (requested) setSelectedInvoice(requested);
  }, [requestedInvoiceId, invoices]);

  function closeDetail() {
    setEditingInvoice(undefined);
    setSelectedInvoice(null);
    if (!requestedInvoiceId && !requestedOrderId) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("comprobante");
    nextParams.delete("pedido");
    setSearchParams(nextParams, { replace: true });
  }

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesStatus = statusFilter === "Todos los estados" || inv.status === statusFilter;
      const matchesType = typeFilter === "Todos los tipos" || inv.type === typeFilter;
      const client = clients.find(c => c.id === inv.clientId);
      const searchLower = search.trim().toLowerCase();
      const order = orders.find(o => o.id === inv.orderId);
      const matchesSearch = !searchLower ||
        inv.number.toLowerCase().includes(searchLower) ||
        (client?.name.toLowerCase().includes(searchLower)) ||
        (order?.number.toLowerCase().includes(searchLower));

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [invoices, clients, orders, search, statusFilter, typeFilter]);

  useEffect(() => {
    if (editingInvoice === undefined && selectedInvoice === null) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeDetail();
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editingInvoice, selectedInvoice, searchParams]);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data && "success" in fetcher.data) {
      closeDetail(); setNotice("Comprobante guardado correctamente.");
    }
  }, [fetcher.data, fetcher.state]);

  function saveInvoice(inv: Invoice) {
    if (fetcher.state !== "idle") return;
    fetcher.submit({ document: JSON.stringify(inv), ...(invoices.some(invoice => invoice.id === inv.id) ? { id: inv.id } : {}) }, { method: "post" });
  }

  function changeInvoiceStatus(status: InvoiceStatus) {
    if (!selectedInvoice) return;
    if (status === "Anulado" && getInvoicePaymentSummary(selectedInvoice, undefined, receipts).paid > 0) {
      setNotice("Anulá los recibos registrados antes de anular la factura.");
      return;
    }
    const updated = { ...selectedInvoice, status };
    saveInvoice(updated);
  }

  if (editingInvoice !== undefined) {
    return <fieldset disabled={fetcher.state !== "idle"} className="min-w-0">{serverError && <p role="alert" className="mx-auto mt-4 max-w-4xl text-red-700">{serverError}</p>}<InvoiceForm key={editingInvoice?.id ?? requestedOrderId} invoice={editingInvoice} invoices={invoices} initialOrderId={requestedOrderId} onCancel={closeDetail} onSave={saveInvoice} /></fieldset>;
  }

  if (selectedInvoice) {
    return <fieldset disabled={fetcher.state !== "idle"} className="min-w-0">{serverError && <p role="alert" className="p-4 text-red-700">{serverError}</p>}<InvoiceDetail invoice={selectedInvoice} onClose={closeDetail} onEdit={() => setEditingInvoice(selectedInvoice)} onStatusChange={changeInvoiceStatus} /></fieldset>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <SalesPageHeader
        title="Facturación de Ventas"
        description="Gestión de comprobantes vinculados a pedidos de clientes."
        action={
          <button
            type="button"
            onClick={() => setEditingInvoice(null)}
            className="rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800"
          >+ Nueva Factura</button>
        }
      />

      {notice && (
        <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          {notice}
        </div>
      )}

      <section className="mt-7 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Listado de comprobantes</h2>
            <p className="mt-1 text-sm text-gray-500">{filteredInvoices.length} {filteredInvoices.length === 1 ? "comprobante encontrado" : "comprobantes encontrados"}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:flex">
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar número o cliente..."
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 lg:w-64"
            />
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            >
              <option>Todos los tipos</option>
              {INVOICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            >
              <option>Todos los estados</option>
              {INVOICE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div aria-hidden="true" className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500">?</div>
            <h3 className="mt-4 font-semibold text-gray-900">No encontramos comprobantes</h3>
            <p className="mt-1 text-sm text-gray-500">Prueba con otro término o cambia los filtros.</p>
            <button type="button" onClick={() => { setSearch(""); setStatusFilter("Todos los estados"); setTypeFilter("Todos los tipos"); }} className="mt-4 text-sm font-semibold text-amber-700 hover:text-amber-800">Limpiar filtros</button>
          </div>
        ) : (
          <>
            <div className="hidden lg:grid lg:grid-cols-6 items-center gap-4 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700">
              <div className="min-w-0 text-center">Número / Fecha</div>
              <div className="min-w-0 text-center">Cliente</div>
              <div className="min-w-0 text-center">Pedido</div>
              <div className="min-w-0 text-center">Total</div>
              <div className="min-w-0 text-center">Estado</div>
              <div className="min-w-0 text-center">Acciones</div>
            </div>
            <div className="divide-y divide-gray-100">
            {filteredInvoices.map(invoice => {
              const client = clients.find(c => c.id === invoice.clientId);
              return (
                <article key={invoice.id} className="grid min-w-0 grid-cols-2 items-center gap-x-4 gap-y-3 p-4 transition hover:bg-amber-50/30 lg:grid-cols-6 lg:gap-4 lg:px-5">
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="mb-1 text-xs font-medium text-gray-500">{invoice.date}</p>
                    <h3 className="font-semibold leading-5 text-gray-900">{invoice.number}</h3>
                    <p className="mt-1 text-xs text-gray-500 lg:hidden">{invoice.type}</p>
                  </div>
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Cliente</p>
                    <p className="mt-1 break-words text-sm font-medium text-gray-800 lg:mt-0">{client?.name || "Desconocido"}</p>
                    <p className="hidden lg:block mt-1 text-xs text-gray-500">{invoice.type}</p>
                  </div>
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Pedido</p>
                    <p className="mt-1 break-words text-sm text-gray-800 lg:mt-0">{orders.find(o => o.id === invoice.orderId)?.number || "Sin pedido"}</p>
                  </div>
                  <div className="min-w-0 lg:text-center text-left">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Total</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 lg:mt-0">{formatCurrency(invoice.total)}</p>
                    {invoice.status === "Emitido" && <p className="mt-1 text-xs font-medium text-gray-700">Saldo: {formatCurrency(getInvoicePaymentSummary(invoice, undefined, receipts).balance)}</p>}
                  </div>
                  <div className="flex flex-col items-start gap-1 lg:items-center">
                    <span className="text-xs font-medium text-gray-500 lg:hidden">Estado</span>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(invoice.status)}`}>
                      {invoice.status}
                    </span>
                    {invoice.status === "Emitido" && <span className="text-xs font-medium text-gray-700">{getPaymentStatus(invoice, receipts)}</span>}
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2 border-t border-gray-100 pt-2 lg:col-span-1 lg:border-0 lg:pt-0 lg:justify-center">
                    <button type="button" onClick={() => setSelectedInvoice(invoice)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-600">Ver detalle</button>
                    {invoice.status === "Borrador" && (
                      <button type="button" onClick={() => setEditingInvoice(invoice)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-amber-600">Editar</button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          </>
        )}
      </section>
    </div>
  );
}





