import { useEffect, useMemo, useState } from "react";
import { SalesPageHeader } from "~/components/SalesLayout";
import {
  SAMPLE_CLIENTS,
  SAMPLE_INVOICES,
  SAMPLE_RECEIPTS,
  RECEIPT_STATUSES,
  PAYMENT_METHODS,
  getInvoicePaymentSummary,
  type Receipt,
  type ReceiptStatus,
  type ReceiptPaymentDetail,
  type ReceiptInvoiceDetail,
  type PaymentMethod
} from "~/data/sales";

function getStatusClass(status: ReceiptStatus) {
  switch (status) {
    case "Borrador": return "bg-gray-100 text-gray-800";
    case "Registrado": return "bg-emerald-100 text-emerald-800";
    case "Anulado": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);
}

function receiptValidationError(receipt: Receipt, requireComplete = receipt.status === "Registrado"): string | null {
  if (!receipt.clientId) return "Selecciona un cliente.";
  if (!receipt.date) return "Selecciona una fecha.";
  if (receipt.payments.some(payment => !Number.isFinite(payment.amount) || payment.amount <= 0 || Math.abs(payment.amount * 100 - Math.round(payment.amount * 100)) > 0.000001)) return "Cada pago debe ser positivo y tener como máximo dos decimales.";
  if (new Set(receipt.invoices.map(detail => detail.invoiceId)).size !== receipt.invoices.length) return "Un comprobante no puede imputarse dos veces en el mismo recibo.";
  for (const detail of receipt.invoices) {
    const invoice = SAMPLE_INVOICES.find(item => item.id === detail.invoiceId);
    if (!invoice || invoice.clientId !== receipt.clientId || invoice.status !== "Emitido") return "Selecciona comprobantes emitidos del cliente.";
    if (!Number.isFinite(detail.amountApplied) || detail.amountApplied <= 0 || Math.abs(detail.amountApplied * 100 - Math.round(detail.amountApplied * 100)) > 0.000001) return "Cada importe aplicado debe ser positivo y tener como máximo dos decimales.";
    if (Math.round(detail.amountApplied * 100) > Math.round(getInvoicePaymentSummary(invoice, receipt.id).balance * 100)) return `El importe aplicado a ${invoice.number} supera el saldo pendiente.`;
  }
  const paymentsInCents = Math.round(receipt.payments.reduce((sum, payment) => sum + payment.amount, 0) * 100);
  const appliedInCents = Math.round(receipt.invoices.reduce((sum, detail) => sum + detail.amountApplied, 0) * 100);
  if (requireComplete && (receipt.payments.length === 0 || receipt.invoices.length === 0)) return "Agrega al menos un medio de pago y aplica el importe a un comprobante antes de registrar.";
  if (requireComplete && paymentsInCents !== appliedInCents) return `El total cobrado (${formatCurrency(paymentsInCents / 100)}) debe coincidir con el total aplicado (${formatCurrency(appliedInCents / 100)}).`;
  return null;
}

type ReceiptFormProps = {
  receipt: Receipt | null;
  receipts: Receipt[];
  onCancel: () => void;
  onSave: (rec: Receipt) => void;
};

function ReceiptForm({ receipt, receipts, onCancel, onSave }: ReceiptFormProps) {
  const isNew = !receipt;
  const [clientId, setClientId] = useState(receipt?.clientId || "");
  const [date, setDate] = useState(receipt?.date || new Date().toISOString().split("T")[0]);
  const [invoicesState, setInvoicesState] = useState<ReceiptInvoiceDetail[]>(() => receipt?.invoices.map(detail => ({ ...detail })) || []);
  const [payments, setPayments] = useState<ReceiptPaymentDetail[]>(() => receipt?.payments.map(payment => ({ ...payment })) || []);
  const [observations, setObservations] = useState(receipt?.observations || "");
  const [errorMsg, setErrorMsg] = useState("");

  const [payMethod, setPayMethod] = useState<PaymentMethod>("Efectivo");
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [payRef, setPayRef] = useState("");

  // Comprobantes del cliente seleccionado que tienen saldo > 0 (o que ya están en este recibo)
  const clientInvoices = useMemo(() => {
    if (!clientId) return [];
    return SAMPLE_INVOICES.filter(inv => {
      if (inv.clientId !== clientId || inv.status === "Anulado" || inv.status === "Borrador") return false;
      const bal = getInvoicePaymentSummary(inv, receipt?.id).balance;
      const isIncluded = invoicesState.some(i => i.invoiceId === inv.id);
      return bal > 0 || isIncluded;
    });
  }, [clientId, receipt?.id, invoicesState]);

  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalApplied = invoicesState.reduce((sum, i) => sum + i.amountApplied, 0);

  function handleAddPayment() {
    if (payAmount === "" || !Number.isFinite(payAmount) || payAmount <= 0) return setErrorMsg("El importe del pago debe ser positivo.");
    const newPay: ReceiptPaymentDetail = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      method: payMethod,
      amount: Number(payAmount),
      reference: payRef
    };
    setPayments([...payments, newPay]);
    setPayAmount("");
    setPayRef("");
    setErrorMsg("");
  }

  function handleRemovePayment(id: string) {
    setPayments(payments.filter(p => p.id !== id));
    setErrorMsg("");
  }

  function handleInvoiceChange(invoiceId: string, invoiceNumber: string, applied: number) {
    const updated = invoicesState.map(detail => ({ ...detail }));
    const idx = updated.findIndex(i => i.invoiceId === invoiceId);
    if (applied > 0) {
      if (idx >= 0) updated[idx].amountApplied = applied;
      else updated.push({ invoiceId, invoiceNumber, amountApplied: applied });
    } else {
      if (idx >= 0) updated.splice(idx, 1);
    }
    setInvoicesState(updated);
    setErrorMsg("");
  }

  function handleSubmit(status: ReceiptStatus) {
    const nextNumber = Math.max(0, ...receipts.map(existing => Number(existing.number.slice(-8)) || 0)) + 1;
    const number = isNew ? `RC-0001-${nextNumber.toString().padStart(8, "0")}` : receipt.number;
    const nextReceipt: Receipt = {
      id: isNew ? `rec-${Date.now()}` : receipt.id,
      number,
      date,
      clientId,
      invoices: invoicesState,
      payments,
      total: totalPayments,
      status,
      observations,
    };
    const error = receiptValidationError(nextReceipt, status === "Registrado");
    if (error) return setErrorMsg(error);
    onSave(nextReceipt);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{isNew ? "Nuevo Recibo" : `Editar Recibo ${receipt.number}`}</h1>
        <button type="button" onClick={onCancel} className="text-sm font-medium text-gray-500 hover:text-gray-700">Volver</button>
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">
          {errorMsg}
        </div>
      )}

      <form className="space-y-6">
        {/* Cliente y Fecha */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Datos principales</h2>
          </div>
          <div className="p-5 grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="receipt-client" className="block text-sm font-medium text-gray-700">Cliente *</label>
              <select
                id="receipt-client"
                required
                value={clientId}
                onChange={e => {
                  setClientId(e.target.value);
                  setInvoicesState([]);
                  setErrorMsg("");
                }}
                disabled={!isNew}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-gray-50"
              >
                <option value="">Seleccionar...</option>
                {SAMPLE_CLIENTS.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="receipt-date" className="block text-sm font-medium text-gray-700">Fecha de emisión *</label>
              <input
                id="receipt-date"
                type="date"
                required
                value={date}
                onChange={e => {
                  setDate(e.target.value);
                  setErrorMsg("");
                }}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>
        </div>

        {/* Medios de Pago */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Medios de Pago</h2>
            <span className="text-sm font-medium text-gray-500">Total cobrado: <span className="font-bold text-gray-900">{formatCurrency(totalPayments)}</span></span>
          </div>
          <div className="p-5">
            <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="w-40">
                <label htmlFor="receipt-method" className="block text-xs font-medium text-gray-700 mb-1">Método</label>
                <select
                  id="receipt-method"
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value as PaymentMethod)}
                  className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-amber-500"
                >
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label htmlFor="receipt-reference" className="block text-xs font-medium text-gray-700 mb-1">Referencia (opcional)</label>
                <input
                  id="receipt-reference"
                  type="text"
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  placeholder="N° de Cheque, Transf..."
                  className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:border-amber-500"
                />
              </div>
              <div className="w-32">
                <label htmlFor="receipt-amount" className="block text-xs font-medium text-gray-700 mb-1">Importe</label>
                <input
                  id="receipt-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="$ 0.00"
                  className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-right text-gray-900 outline-none placeholder:text-gray-500 focus:border-amber-500"
                />
              </div>
              <button
                type="button"
                onClick={handleAddPayment}
                disabled={!payAmount || payAmount <= 0}
                className="h-9 rounded-md bg-amber-100 px-4 text-sm font-medium text-amber-800 hover:bg-amber-200 disabled:opacity-50"
              >
                Agregar
              </button>
            </div>

            {payments.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[540px] text-left text-sm text-gray-900">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-4 py-2 font-medium">Medio</th>
                    <th className="px-4 py-2 font-medium">Referencia</th>
                    <th className="px-4 py-2 text-right font-medium">Importe</th>
                    <th className="px-4 py-2 text-center font-medium">Quitar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map(p => (
                    <tr key={p.id} className="bg-white">
                      <td className="px-4 py-2">{p.method}</td>
                      <td className="px-4 py-2 text-gray-500">{p.reference || "-"}</td>
                      <td className="px-4 py-2 text-right font-medium">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-2 text-center">
                        <button type="button" onClick={() => handleRemovePayment(p.id)} className="font-medium text-red-700 hover:text-red-900" aria-label={`Quitar pago de ${formatCurrency(p.amount)}`}>Quitar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>

        {/* Aplicación a Comprobantes */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Aplicación a Comprobantes pendientes</h2>
            <span className="text-sm font-medium text-gray-500">Total aplicado: <span className="font-bold text-emerald-700">{formatCurrency(totalApplied)}</span></span>
          </div>
          <div className="p-5">
            {!clientId ? (
              <p className="text-sm text-gray-500">Selecciona un cliente para ver sus comprobantes.</p>
            ) : clientInvoices.length === 0 ? (
              <p className="text-sm text-gray-500">El cliente no tiene comprobantes pendientes.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full min-w-[680px] text-left text-sm text-gray-900">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="px-4 py-2 font-medium">Comprobante</th>
                      <th className="px-4 py-2 font-medium">Emisión</th>
                      <th className="px-4 py-2 text-right font-medium">Total</th>
                      <th className="px-4 py-2 text-right font-medium">Saldo Actual</th>
                      <th className="px-4 py-2 text-right font-medium w-32">Monto a Aplicar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {clientInvoices.map(inv => {
                      const { paid, balance } = getInvoicePaymentSummary(inv, receipt?.id);
                      const applied = invoicesState.find(i => i.invoiceId === inv.id)?.amountApplied || "";
                      return (
                        <tr key={inv.id} className="bg-white hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-medium">{inv.number}</td>
                          <td className="px-4 py-3 text-gray-500">{inv.date}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(inv.total)}</td>
                          <td className="px-4 py-3 text-right text-red-700 font-medium">
                            {formatCurrency(balance)}
                            <span className="block text-xs font-normal text-gray-600">Pagado: {formatCurrency(paid)}</span>
                            {Number(applied) > 0 && <span className="block text-xs font-normal text-gray-700">Restará: {formatCurrency(Math.max(0, balance - Number(applied)))}</span>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              min="0"
                              max={balance}
                              step="0.01"
                              value={applied}
                              onChange={e => handleInvoiceChange(inv.id, inv.number, Number(e.target.value))}
                              placeholder="0.00"
                              aria-label={`Monto a aplicar a ${inv.number}`}
                              className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-right text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {Math.abs(totalPayments - totalApplied) > 0.01 && totalPayments > 0 && (
              <div className="mt-3 text-right text-xs text-red-600 font-medium">
                La aplicación difiere de los pagos por {formatCurrency(Math.abs(totalPayments - totalApplied))}.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Observaciones</h2>
          </div>
          <div className="p-5">
            <textarea
              aria-label="Observaciones del recibo"
              rows={2}
              value={observations}
              onChange={e => setObservations(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancelar</button>
          <button type="button" onClick={() => handleSubmit("Borrador")} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50">Guardar Borrador</button>
          <button type="button" onClick={() => handleSubmit("Registrado")} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">Registrar Pago</button>
        </div>
      </form>
    </div>
  );
}

type ReceiptDetailProps = {
  receipt: Receipt;
  notice: string;
  onClose: () => void;
  onEdit: () => void;
  onChangeStatus: (s: ReceiptStatus) => void;
};

function ReceiptDetail({ receipt, notice, onClose, onEdit, onChangeStatus }: ReceiptDetailProps) {
  const client = SAMPLE_CLIENTS.find(c => c.id === receipt.clientId);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Recibo {receipt.number}</h1>
        <button type="button" onClick={onClose} className="text-sm font-medium text-gray-500 hover:text-gray-700">Volver al listado</button>
      </div>
      {notice && <div role="alert" className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{notice}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Medios de Pago</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm text-gray-900">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-4 py-2 font-medium">Método</th>
                    <th className="px-4 py-2 font-medium">Referencia</th>
                    <th className="px-4 py-2 text-right font-medium">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {receipt.payments.map(p => (
                    <tr key={p.id}>
                      <td className="px-4 py-3">{p.method}</td>
                      <td className="px-4 py-3 text-gray-500">{p.reference || "-"}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-right font-semibold text-gray-900">
              Total Pago: {formatCurrency(receipt.total)}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Comprobantes Imputados</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm text-gray-900">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-4 py-2 font-medium">Comprobante</th>
                    <th className="px-4 py-2 text-right font-medium">Importe Aplicado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {receipt.invoices.map(inv => (
                    <tr key={inv.invoiceId}>
                      <td className="px-4 py-3 font-medium text-emerald-700">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(inv.amountApplied)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {receipt.observations && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="text-sm font-semibold text-amber-900">Observaciones</h3>
              <p className="mt-2 text-sm text-amber-800 whitespace-pre-wrap">{receipt.observations}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Información general</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Estado</dt>
                <dd>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusClass(receipt.status)}`}>
                    {receipt.status}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-3">
                <dt className="text-gray-500">Cliente</dt>
                <dd className="font-medium text-gray-900 text-right">{client?.name || "Desconocido"}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <dt className="text-gray-500">Fecha</dt>
                <dd className="font-medium text-gray-900">{receipt.date}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-3">
            {receipt.status === "Borrador" && (
              <button type="button" onClick={() => onChangeStatus("Registrado")} className="w-full rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-800 transition">
                Registrar Pago
              </button>
            )}

            {receipt.status === "Borrador" && (
              <button type="button" onClick={onEdit} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition">
                Editar Recibo
              </button>
            )}

            {receipt.status === "Registrado" && (
              <button type="button" onClick={() => { if(confirm("¿Estás seguro de anular este recibo? Los saldos volverán a su estado anterior.")) onChangeStatus("Anulado"); }} className="w-full rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 transition">
                Anular Recibo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Recibos() {
  const [receipts, setReceipts] = useState<Receipt[]>(() => [...SAMPLE_RECEIPTS]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos los estados");
  const [notice, setNotice] = useState("");

  const [editingReceipt, setEditingReceipt] = useState<Receipt | null | undefined>(undefined);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const filteredReceipts = useMemo(() => {
    return receipts.filter(rec => {
      const matchesStatus = statusFilter === "Todos los estados" || rec.status === statusFilter;
      const client = SAMPLE_CLIENTS.find(c => c.id === rec.clientId);
      const searchLower = search.trim().toLowerCase();
      const matchesSearch = !searchLower ||
        rec.number.toLowerCase().includes(searchLower) ||
        (client?.name.toLowerCase().includes(searchLower)) ||
        rec.invoices.some(i => i.invoiceNumber.toLowerCase().includes(searchLower));

      return matchesStatus && matchesSearch;
    });
  }, [receipts, search, statusFilter]);

  useEffect(() => {
    if (editingReceipt === undefined && selectedReceipt === null) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setEditingReceipt(undefined);
        setSelectedReceipt(null);
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editingReceipt, selectedReceipt]);

  function saveReceipt(rec: Receipt) {
    const previousReceipt = SAMPLE_RECEIPTS.find(r => r.id === rec.id);
    const isNew = !previousReceipt;
    if (isNew) {
      SAMPLE_RECEIPTS.unshift(rec);
      setNotice(rec.status === "Registrado" ? "Pago registrado en memoria; los saldos se actualizaron hasta recargar la aplicación." : "Borrador guardado en memoria; no afecta los saldos y se pierde al recargar la aplicación.");
    } else {
      const idx = SAMPLE_RECEIPTS.findIndex(r => r.id === rec.id);
      if (idx >= 0) SAMPLE_RECEIPTS[idx] = rec;
      if (previousReceipt.status === "Registrado" && rec.status === "Anulado") {
        setNotice("Recibo anulado en memoria; sus importes dejaron de afectar los saldos hasta recargar la aplicación.");
      } else if (previousReceipt.status === "Borrador" && rec.status === "Registrado") {
        setNotice("Pago registrado en memoria; los saldos se actualizaron hasta recargar la aplicación.");
      } else {
        setNotice("Borrador actualizado en memoria; los cambios se pierden al recargar la aplicación.");
      }
    }
    setReceipts([...SAMPLE_RECEIPTS]);
    setEditingReceipt(undefined);
    if (selectedReceipt && selectedReceipt.id === rec.id) {
        setSelectedReceipt(rec);
    } else {
        setSelectedReceipt(null);
    }
  }

  function changeReceiptStatus(status: ReceiptStatus) {
    if (!selectedReceipt) return;
    const isValidTransition =
      (selectedReceipt.status === "Borrador" && status === "Registrado") ||
      (selectedReceipt.status === "Registrado" && status === "Anulado");
    if (!isValidTransition) {
      setNotice(`No se puede cambiar un recibo ${selectedReceipt.status.toLowerCase()} a ${status.toLowerCase()}.`);
      return;
    }
    const updated = { ...selectedReceipt, status };
    if (status === "Registrado") {
      const error = receiptValidationError(updated);
      if (error) {
        setNotice(error);
        return;
      }
    }
    saveReceipt(updated);
  }

  if (editingReceipt !== undefined) {
    return <ReceiptForm receipt={editingReceipt} receipts={receipts} onCancel={() => setEditingReceipt(undefined)} onSave={saveReceipt} />;
  }

  if (selectedReceipt) {
    return <ReceiptDetail receipt={selectedReceipt} notice={notice} onClose={() => setSelectedReceipt(null)} onEdit={() => setEditingReceipt(selectedReceipt)} onChangeStatus={changeReceiptStatus} />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SalesPageHeader
        title="Recibos de Pago"
        description="Registro de cobranzas e imputaciones de comprobantes."
        action={
          <button
            type="button"
            onClick={() => setEditingReceipt(null)}
            className="rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800"
          >
            + Nuevo Recibo
          </button>
        }
      />

      {notice && (
        <div className="mb-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-200">
          {notice}
        </div>
      )}

      <section className="mt-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Todos los recibos</h2>
            <p className="mt-1 text-sm text-gray-600">{filteredReceipts.length} {filteredReceipts.length === 1 ? "recibo encontrado" : "recibos encontrados"}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por número, cliente o factura..."
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 sm:w-64"
            />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            >
              <option>Todos los estados</option>
              {RECEIPT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {filteredReceipts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-sm text-gray-500">No se encontraron recibos que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <>
            <div className="hidden lg:grid lg:grid-cols-6 items-center gap-4 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700">
              <div className="min-w-0 text-center">Número / Fecha</div>
              <div className="min-w-0 text-center">Cliente</div>
              <div className="min-w-0 text-center">Comprobantes</div>
              <div className="min-w-0 text-center">Total</div>
              <div className="min-w-0 text-center">Estado</div>
              <div className="min-w-0 text-center">Acciones</div>
            </div>
            <div className="divide-y divide-gray-100">
            {filteredReceipts.map(receipt => {
              const client = SAMPLE_CLIENTS.find(c => c.id === receipt.clientId);
              return (
                <article key={receipt.id} className="grid min-w-0 grid-cols-2 items-center gap-x-4 gap-y-3 p-4 transition hover:bg-amber-50/30 lg:grid-cols-6 lg:gap-4 lg:px-5">
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="mb-1 text-xs font-medium text-gray-500">{receipt.date}</p>
                    <h3 className="font-semibold leading-5 text-gray-900">{receipt.number}</h3>
                  </div>
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Cliente</p>
                    <p className="mt-1 break-words text-sm font-medium text-gray-800 lg:mt-0">{client?.name || "Desconocido"}</p>
                  </div>
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Comprobantes</p>
                    <p className="mt-1 break-words text-sm text-emerald-700 font-medium lg:mt-0">
                      {receipt.invoices.map(i => i.invoiceNumber).join(", ") || "Ninguno"}
                    </p>
                  </div>
                  <div className="min-w-0 lg:text-center text-left">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Total</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 lg:mt-0">{formatCurrency(receipt.total)}</p>
                  </div>
                  <div className="flex flex-col items-start gap-1 lg:items-center">
                    <span className="text-xs font-medium text-gray-500 lg:hidden">Estado</span>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(receipt.status)}`}>
                      {receipt.status}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2 border-t border-gray-100 pt-2 lg:col-span-1 lg:border-0 lg:pt-0 lg:justify-center">
                    <button type="button" onClick={() => setSelectedReceipt(receipt)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-600">Ver detalle</button>
                    {receipt.status === "Borrador" && (
                      <button type="button" onClick={() => setEditingReceipt(receipt)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-amber-600">Editar</button>
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
