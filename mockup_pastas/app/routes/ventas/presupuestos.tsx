import BackToListButton from "~/components/BackToListButton";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { SalesFormHeader, SalesPageHeader, SalesListPanel, SalesEmptyState } from "~/components/SalesLayout";
import { SAMPLE_EMPLOYEES } from "~/data/employees";
import {
  SAMPLE_CLIENTS,
  SAMPLE_PRODUCTS,
  SAMPLE_BUDGETS,
  SAMPLE_ORDERS,
  BUDGET_STATUSES,
  type Budget,
  type BudgetStatus,
  type BudgetItem,
  type Order
} from "~/data/sales";

function getStatusClass(status: BudgetStatus) {
  switch (status) {
    case "Borrador": return "bg-gray-100 text-gray-800";
    case "Enviado": return "bg-sky-100 text-sky-800";
    case "Aceptado": return "bg-emerald-100 text-emerald-800";
    case "Convertido": return "bg-purple-100 text-purple-800";
    case "Rechazado": return "bg-red-100 text-red-800";
    case "Vencido": return "bg-amber-100 text-amber-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);
}

type BudgetFormProps = {
  budget: Budget | null;
  budgets: Budget[];
  onCancel: () => void;
  onSave: (bud: Budget) => void;
};

function BudgetForm({ budget, budgets, onCancel, onSave }: BudgetFormProps) {
  const isNew = !budget;
  const [clientId, setClientId] = useState(budget?.clientId || "");
  const [date, setDate] = useState(budget?.date || new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil] = useState(budget?.validUntil || "");
  const [items, setItems] = useState<BudgetItem[]>(budget?.items || []);
  const [discount, setDiscount] = useState(budget?.discount || 0);
  const [observations, setObservations] = useState(budget?.observations || "");
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const selectedClient = SAMPLE_CLIENTS.find(c => c.id === clientId);

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.subtotal, 0), [items]);
  const total = Math.max(0, subtotal - discount);

  function handleAddItem() {
    const product = SAMPLE_PRODUCTS.find(p => p.id === selectedProductId);
    if (!product || quantity <= 0) return;

    const newItem: BudgetItem = {
      id: `bi-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: product.price,
      subtotal: product.price * quantity
    };
    setItems([...items, newItem]);
    setSelectedProductId("");
    setQuantity(1);
    setErrorMsg("");
  }

  function handleRemoveItem(id: string) {
    setItems(items.filter(i => i.id !== id));
  }

  function handleSubmit(status: BudgetStatus) {
    if (!clientId) return setErrorMsg("Selecciona un cliente válido.");
    if (items.length === 0) return setErrorMsg("El presupuesto debe tener al menos un renglón.");
    if (!validUntil) return setErrorMsg("Selecciona la fecha de vigencia.");
    if (validUntil < date) return setErrorMsg("La vigencia no puede ser anterior a la fecha de emisión.");
    if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) {
      return setErrorMsg("El descuento debe estar entre cero y el subtotal.");
    }

    const nextNumber = Math.max(0, ...budgets.map(existing => Number(existing.number.slice(-6)) || 0)) + 1;
    const number = isNew ? `PR-${nextNumber.toString().padStart(6, "0")}` : budget.number;

    onSave({
      id: isNew ? `bud-${Date.now()}` : budget.id,
      number,
      date,
      validUntil,
      clientId,
      items,
      subtotal,
      discount,
      total,
      status,
      observations,
      orderId: budget?.orderId,
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <SalesFormHeader title={isNew ? "Nuevo presupuesto" : `Editar presupuesto ${budget.number}`} onCancel={onCancel} />

      {errorMsg && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">
          {errorMsg}
        </div>
      )}

      <form noValidate onSubmit={event => event.preventDefault()} className="space-y-8">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Datos principales</h2>
          </div>
          <div className="p-5">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cliente *</label>
                <select
                  required
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                >
                  <option value="">Seleccionar...</option>
                  {SAMPLE_CLIENTS.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de emisión *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Válido hasta *</label>
                <input
                  type="date"
                  required
                  value={validUntil}
                  onChange={e => setValidUntil(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              {selectedClient && (
                <div className="sm:col-span-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 border border-gray-100">
                  <p><span className="font-medium">{selectedClient.documentType}:</span> {selectedClient.cuitCuil || "N/A"}</p>
                  <p><span className="font-medium">Condición fiscal:</span> {selectedClient.ivaType || "N/A"}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Conceptos</h2>
          </div>
          <div className="p-5">
            <div data-validation-message={items.length ? "" : "Agregá al menos un producto al presupuesto."} className="mb-6 rounded-lg border border-gray-100 bg-gray-50 p-4">
              <h3 className="mb-3 text-sm font-medium text-gray-700">Agregar producto</h3>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Producto</label>
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  >
                    <option value="">Seleccionar...</option>
                    {SAMPLE_PRODUCTS.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    data-validation-skip value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedProductId || quantity < 1}
                  className="h-9 rounded-md bg-amber-100 px-4 text-sm font-medium text-amber-800 hover:bg-amber-200 disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-gray-500">No hay renglones en el presupuesto.</p>
            ) : (
              <>
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 sm:hidden">
                {items.map(item => (
                  <li key={item.id} className="flex min-w-0 items-start justify-between gap-3 p-3 text-sm">
                    <div className="min-w-0">
                      <p className="break-words font-medium text-gray-900">{item.productName}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                      <p className="mt-1 font-medium text-gray-800">{formatCurrency(item.subtotal)}</p>
                    </div>
                    <button type="button" aria-label={`Quitar ${item.productName}`} onClick={() => handleRemoveItem(item.id)} className="shrink-0 rounded px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50">Quitar</button>
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-x-auto rounded-lg border border-gray-200 sm:block">
                <table className="w-full min-w-[620px] text-left text-sm text-gray-900">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">Producto</th>
                      <th className="px-4 py-2 text-right font-medium">Cant.</th>
                      <th className="px-4 py-2 text-right font-medium">Precio Uni.</th>
                      <th className="px-4 py-2 text-right font-medium">Subtotal</th>
                      <th className="px-4 py-2 text-center font-medium">Quitar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map(item => (
                      <tr key={item.id} className="bg-white">
                        <td className="px-4 py-2">{item.productName}</td>
                        <td className="px-4 py-2 text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900">{formatCurrency(item.subtotal)}</td>
                        <td className="px-4 py-2 text-center">
                          <button type="button" aria-label={`Quitar ${item.productName}`} onClick={() => handleRemoveItem(item.id)} className="text-red-600 hover:text-red-800">Quitar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}

            <div className="mt-6 flex justify-end">
              <div className="w-full max-w-xs space-y-3 rounded-lg bg-gray-50 p-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <label htmlFor="discountInput" className="font-medium">Descuento</label>
                  <div className="flex items-center gap-1">
                    <span>$</span>
                    <input
                      id="discountInput"
                      type="number"
                      min="0"
                      max={subtotal}
                      step="0.01"
                      value={discount}
                      onChange={e => setDiscount(Number(e.target.value))}
                      className="w-24 rounded-md border border-gray-300 px-2 py-1 text-right text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Observaciones</h2>
          </div>
          <div className="p-5">
            <textarea
              rows={3}
              value={observations}
              onChange={e => setObservations(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              placeholder="Notas internas o pautas para el cliente..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancelar</button>
          <button type="button" data-validate-form onClick={() => handleSubmit("Borrador")} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50">Guardar Borrador</button>
          <button type="button" data-validate-form onClick={() => handleSubmit("Enviado")} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700">Guardar y Marcar Enviado</button>
        </div>
      </form>
    </div>
  );
}

type BudgetDetailProps = {
  budget: Budget;
  onClose: () => void;
  onEdit: () => void;
  onChangeStatus: (s: BudgetStatus) => void;
  onConvertToOrder: (employeeId: string) => void;
  conversionError: string;
  convertedOrder: { id: string; number: string } | null;
};

function BudgetDetail({ budget, onClose, onEdit, onChangeStatus, onConvertToOrder, conversionError, convertedOrder }: BudgetDetailProps) {
  const client = SAMPLE_CLIENTS.find(c => c.id === budget.clientId);
  const associatedOrder = budget.orderId ? SAMPLE_ORDERS.find(order => order.id === budget.orderId) : undefined;
  const [employeeId, setEmployeeId] = useState("");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="sticky top-16 z-30 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 py-3">
        <h1 className="text-2xl font-bold text-gray-900">Presupuesto {budget.number}</h1>
        <BackToListButton onClick={onClose} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Detalle de conceptos</h2>
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 sm:hidden">
              {budget.items.map(item => (
                <li key={item.id} className="min-w-0 p-3 text-sm">
                  <p className="break-words font-medium text-gray-900">{item.productName}</p>
                  <p className="mt-1 text-xs text-gray-500">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                  <p className="mt-1 text-right font-medium text-gray-800">{formatCurrency(item.subtotal)}</p>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto rounded-lg border border-gray-200 sm:block">
              <table className="w-full min-w-[540px] text-left text-sm text-gray-900">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Producto</th>
                    <th className="px-4 py-2 text-right font-medium">Cant.</th>
                    <th className="px-4 py-2 text-right font-medium">Precio Uni.</th>
                    <th className="px-4 py-2 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {budget.items.map(item => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">{item.productName}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(budget.subtotal)}</span>
                </div>
                {budget.discount > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Descuento</span>
                    <span>- {formatCurrency(budget.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(budget.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {budget.observations && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="text-sm font-semibold text-amber-900">Observaciones</h3>
              <p className="mt-2 text-sm text-amber-800 whitespace-pre-wrap">{budget.observations}</p>
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
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusClass(budget.status)}`}>
                    {budget.status}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Cliente</dt>
                <dd className="font-medium text-gray-900 text-right">{client?.name || "Desconocido"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Emisión</dt>
                <dd className="font-medium text-gray-900">{budget.date}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <dt className="text-gray-500">Válido hasta</dt>
                <dd className="font-medium text-gray-900">{budget.validUntil}</dd>
              </div>
              {budget.orderId && (
                <div className="flex justify-between pt-1">
                  <dt className="text-gray-500">Pedido asociado</dt>
                  <dd className="font-medium text-purple-700">
                    <Link to={`/ventas/pedidos?pedido=${encodeURIComponent(budget.orderId)}`} className="underline underline-offset-2">{associatedOrder?.number || budget.orderId}</Link>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-3">
            {convertedOrder && (
              <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <p>Pedido {convertedOrder.number} creado correctamente.</p>
                <Link to={`/ventas/pedidos?pedido=${encodeURIComponent(convertedOrder.id)}`} className="mt-2 inline-flex font-semibold underline underline-offset-2">Abrir pedido</Link>
              </div>
            )}
            {budget.status === "Borrador" && (
              <button type="button" onClick={() => onChangeStatus("Enviado")} className="w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 transition">
                Marcar como Enviado
              </button>
            )}

            {budget.status === "Enviado" && (
              <>
                <button type="button" onClick={() => onChangeStatus("Aceptado")} className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition">
                  Marcar como Aceptado
                </button>
                <button type="button" onClick={() => onChangeStatus("Rechazado")} className="w-full rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 transition">
                  Marcar como Rechazado
                </button>
              </>
            )}

            {budget.status === "Aceptado" && !budget.orderId && (
              <form noValidate onSubmit={event => { event.preventDefault(); onConvertToOrder(employeeId); }} className="space-y-2">
                <div>
                <label htmlFor="conversion-employee" className="block text-sm font-medium text-gray-700">Empleado responsable *</label>
                <select id="conversion-employee" required value={employeeId} onChange={event => setEmployeeId(event.target.value)} className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100">
                  <option value="">Seleccionar empleado...</option>
                  {SAMPLE_EMPLOYEES.filter(employee => employee.status === "Activo").map(employee => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
                </select>
                </div>
                {conversionError && <p role="alert" className="text-sm text-red-700">{conversionError}</p>}
                <button type="submit" className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-purple-700">
                  Convertir a Pedido
                </button>
              </form>
            )}

            {(budget.status === "Borrador" || budget.status === "Enviado") && (
              <button type="button" onClick={onEdit} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition">
                Editar Presupuesto
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Presupuestos() {
  const [budgets, setBudgets] = useState<Budget[]>(() => [...SAMPLE_BUDGETS]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos los estados");
  const [notice, setNotice] = useState("");
  const [conversionError, setConversionError] = useState("");
  const [convertedOrder, setConvertedOrder] = useState<{ id: string; number: string } | null>(null);

  const [editingBudget, setEditingBudget] = useState<Budget | null | undefined>(undefined);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const filteredBudgets = useMemo(() => {
    return budgets.filter(bud => {
      const matchesStatus = statusFilter === "Todos los estados" || bud.status === statusFilter;
      const client = SAMPLE_CLIENTS.find(c => c.id === bud.clientId);
      const searchLower = search.trim().toLowerCase();
      const matchesSearch = !searchLower ||
        bud.number.toLowerCase().includes(searchLower) ||
        (client?.name.toLowerCase().includes(searchLower)) ||
        (client?.code.toLowerCase().includes(searchLower)) ||
        (client?.cuitCuil.toLowerCase().includes(searchLower));

      return matchesStatus && matchesSearch;
    });
  }, [budgets, search, statusFilter]);

  useEffect(() => {
    if (editingBudget === undefined && selectedBudget === null) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setEditingBudget(undefined);
        setSelectedBudget(null);
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editingBudget, selectedBudget]);

  function saveBudget(bud: Budget) {
    const isNew = !SAMPLE_BUDGETS.some(b => b.id === bud.id);
    if (isNew) {
      SAMPLE_BUDGETS.unshift(bud);
      setNotice("Presupuesto guardado en memoria hasta recargar la aplicación.");
    } else {
      const idx = SAMPLE_BUDGETS.findIndex(b => b.id === bud.id);
      if (idx >= 0) SAMPLE_BUDGETS[idx] = bud;
      setNotice("Presupuesto actualizado en memoria hasta recargar la aplicación.");
    }
    setBudgets([...SAMPLE_BUDGETS]);
    setEditingBudget(undefined);
    if (selectedBudget && selectedBudget.id === bud.id) {
        setSelectedBudget(bud);
    } else {
        setSelectedBudget(null);
    }
  }

  function changeBudgetStatus(status: BudgetStatus) {
    if (!selectedBudget) return;
    const updated = { ...selectedBudget, status };
    saveBudget(updated);
  }

  function convertToOrder(employeeId: string) {
    if (!selectedBudget || selectedBudget.status !== "Aceptado") return;
    if (selectedBudget.orderId) {
      setNotice("Este presupuesto ya fue convertido a pedido.");
      return;
    }

    const employeeExists = SAMPLE_EMPLOYEES.some(candidate => candidate.id === employeeId && candidate.status === "Activo");
    if (!employeeExists) {
      setConversionError("Selecciona un empleado responsable activo.");
      return;
    }
    const clientExists = SAMPLE_CLIENTS.some(client => client.id === selectedBudget.clientId);
    const subtotal = selectedBudget.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discount = selectedBudget.discount;
    if (!clientExists || selectedBudget.items.length === 0 || !Number.isFinite(subtotal) ||
      selectedBudget.items.some(item => !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitPrice) || item.unitPrice < 0) ||
      !Number.isFinite(discount) || discount < 0 || discount > subtotal) {
      setConversionError("No se puede convertir: revisa el cliente, los productos y los importes del presupuesto.");
      return;
    }
    setConversionError("");

    const nextNumber = Math.max(0, ...SAMPLE_ORDERS.map(existing => Number(existing.number.match(/(\d+)$/)?.[1]) || 0)) + 1;
    const orderNumber = `PC-${nextNumber.toString().padStart(6, "0")}`;
    const newOrderId = `o-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const orderTotal = Math.max(0, subtotal - discount);

    const newOrder: Order = {
      id: newOrderId,
      number: orderNumber,
      date: new Date().toISOString().split("T")[0],
      clientId: selectedBudget.clientId,
      employeeId,
      items: selectedBudget.items.map(item => ({
        id: `oi-${newOrderId}-${item.id}`,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.quantity * item.unitPrice
      })),
      subtotal,
      discount,
      total: orderTotal,
      status: "Pendiente",
      observations: [selectedBudget.observations.trim(), `Convertido desde Presupuesto ${selectedBudget.number}`].filter(Boolean).join("\n"),
      deliveryAddressType: "client",
      deliveryDate: ""
    };

    SAMPLE_ORDERS.unshift(newOrder);

    const updatedBudget = { ...selectedBudget, subtotal, total: orderTotal, status: "Convertido" as BudgetStatus, orderId: newOrderId };
    saveBudget(updatedBudget);
    setConvertedOrder({ id: newOrderId, number: orderNumber });
    setNotice(`Pedido ${orderNumber} creado en memoria y presupuesto marcado como convertido.`);
    setSelectedBudget(updatedBudget);
  }

  if (editingBudget !== undefined) {
    return <BudgetForm budget={editingBudget} budgets={budgets} onCancel={() => setEditingBudget(undefined)} onSave={saveBudget} />;
  }

  if (selectedBudget) {
    return <BudgetDetail budget={selectedBudget} onClose={() => { setSelectedBudget(null); setConvertedOrder(null); setConversionError(""); }} onEdit={() => setEditingBudget(selectedBudget)} onChangeStatus={changeBudgetStatus} onConvertToOrder={convertToOrder} conversionError={conversionError} convertedOrder={convertedOrder} />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SalesPageHeader
        title="Presupuestos Clientes"
        description="Creación, seguimiento y aprobación de presupuestos para clientes."
        action={
          <button
            type="button"
            onClick={() => setEditingBudget(null)}
            className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
          >
            + Nuevo presupuesto
          </button>
        }
      />

      {notice && (
        <div role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      <SalesListPanel
        title="Listado de presupuestos"
        summary={`${filteredBudgets.length} ${filteredBudgets.length === 1 ? "presupuesto encontrado" : "presupuestos encontrados"}`}
        filters={<>
          <label className="sr-only" htmlFor="budget-search">Buscar presupuestos</label>
          <input id="budget-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por número o cliente..." className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 lg:w-64" />
          <label className="sr-only" htmlFor="budget-status-filter">Filtrar presupuestos por estado</label>
          <select id="budget-status-filter" value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100">
            <option>Todos los estados</option>
            {BUDGET_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
        </>}
      >
        {filteredBudgets.length === 0 ? (
          <SalesEmptyState entity="presupuestos" onReset={() => { setSearch(""); setStatusFilter("Todos los estados"); }} />
        ) : (
          <>
            <div className="hidden lg:grid lg:grid-cols-6 items-center gap-4 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <div className="min-w-0 text-center">Número / Emisión</div>
              <div className="min-w-0 text-center">Cliente</div>
              <div className="min-w-0 text-center">Vigencia</div>
              <div className="min-w-0 text-center">Total</div>
              <div className="min-w-0 text-center">Estado</div>
              <div className="min-w-0 text-center">Acciones</div>
            </div>
            <div className="divide-y divide-gray-100">
            {filteredBudgets.map(budget => {
              const client = SAMPLE_CLIENTS.find(c => c.id === budget.clientId);
              return (
                <article key={budget.id} className="grid min-w-0 grid-cols-2 items-center gap-x-4 gap-y-3 p-4 transition hover:bg-amber-50/30 lg:grid-cols-6 lg:gap-4 lg:px-5">
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="mb-1 text-xs font-medium text-gray-500">{budget.date}</p>
                    <h3 className="break-words font-semibold leading-5 text-gray-900">{budget.number}</h3>
                  </div>
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Cliente</p>
                    <p className="mt-1 break-words text-sm font-medium text-gray-800 lg:mt-0">{client?.name || "Desconocido"}</p>
                  </div>
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Vigencia</p>
                    <p className="mt-1 break-words text-sm text-gray-800 lg:mt-0">{budget.validUntil}</p>
                  </div>
                  <div className="min-w-0 lg:text-center text-left">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Total</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 lg:mt-0">{formatCurrency(budget.total)}</p>
                  </div>
                  <div className="flex flex-col items-start gap-1 lg:items-center">
                    <span className="text-xs font-medium text-gray-500 lg:hidden">Estado</span>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(budget.status)}`}>
                      {budget.status}
                    </span>
                  </div>
                  <div className="col-span-2 flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-2 lg:col-span-1 lg:border-0 lg:pt-0 lg:justify-center">
                    <button type="button" onClick={() => setSelectedBudget(budget)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-600">Ver detalle</button>
                    {(budget.status === "Borrador" || budget.status === "Enviado") && (
                      <button type="button" onClick={() => setEditingBudget(budget)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-amber-600">Editar</button>
                    )}
                  </div>
                </article>
              );
            })}
            </div>
          </>
        )}
      </SalesListPanel>
    </div>
  );
}
