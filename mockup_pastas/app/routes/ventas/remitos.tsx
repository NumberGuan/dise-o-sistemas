import BackToListButton from "~/components/BackToListButton";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { SalesFormHeader, SalesPageHeader } from "~/components/SalesLayout";
import {
  SAMPLE_CLIENTS,
  SAMPLE_CUSTOMER_RETURNS,
  SAMPLE_ORDERS,
  SAMPLE_REMITS,
  getRemitAvailableQuantity,
  formatClientAddress,
  REMIT_STATUSES,
  type Remit,
  type RemitStatus,
  type RemitItem
} from "~/data/sales";

function getStatusClass(status: RemitStatus) {
  switch (status) {
    case "Borrador": return "bg-gray-100 text-gray-800";
    case "Despachado": return "bg-sky-100 text-sky-800";
    case "Entregado": return "bg-emerald-100 text-emerald-800";
    case "Anulado": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

type RemitFormProps = {
  remit: Remit | null;
  remits: Remit[];
  initialOrderId: string;
  onCancel: () => void;
  onSave: (rem: Remit) => void;
};

function RemitForm({ remit, remits, initialOrderId, onCancel, onSave }: RemitFormProps) {
  const isNew = !remit;
  const [orderId, setOrderId] = useState(remit?.orderId || initialOrderId);
  const [date, setDate] = useState(remit?.date || new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState<RemitItem[]>(remit?.items || []);
  const [observations, setObservations] = useState(remit?.observations || "");
  const [errorMsg, setErrorMsg] = useState("");

  const availableOrders = useMemo(() => {
    const ordersWithRemit = new Set(remits.filter(r => r.id !== remit?.id && r.status !== "Anulado").map(r => r.orderId));
    return SAMPLE_ORDERS.filter(o => (o.status === "Listo para remito" || o.status === "Facturado") && !ordersWithRemit.has(o.id));
  }, [remit?.id, remits]);

  useEffect(() => {
    if (orderId && isNew) {
      const order = SAMPLE_ORDERS.find(o => o.id === orderId);
      if (order) {
        setItems(order.items.map(item => ({
          id: `ri-${item.id}`,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity
        })));
      }
    } else if (!orderId && isNew) {
      setItems([]);
    }
  }, [orderId, isNew]);

  const selectedOrder = SAMPLE_ORDERS.find(o => o.id === orderId);
  const selectedClient = SAMPLE_CLIENTS.find(c => c.id === selectedOrder?.clientId);

  function handleQuantityChange(id: string, qty: number) {
    setItems(items.map(i => i.id === id ? { ...i, quantity: qty } : i));
  }

  function handleSubmit(status: RemitStatus) {
    if (!orderId) return setErrorMsg("Selecciona un pedido asociado.");
    if (!selectedOrder || (isNew && !availableOrders.some(o => o.id === orderId))) return setErrorMsg("Selecciona un pedido listo para remito o facturado, sin otro remito activo.");
    if (!selectedClient) return setErrorMsg("El pedido debe tener un cliente válido.");
    if (!date) return setErrorMsg("Selecciona la fecha de emisión.");
    if (remits.some(r => r.orderId === orderId && r.id !== remit?.id && r.status !== "Anulado")) return setErrorMsg("Ya existe un remito activo para este pedido.");
    if (items.length === 0 || items.length !== selectedOrder.items.length || items.some((item, index) => item.productId !== selectedOrder.items[index]?.productId)) return setErrorMsg("Los productos del remito deben coincidir con el pedido.");
    if (items.some((item, index) => !Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > selectedOrder.items[index].quantity)) return setErrorMsg("Cada cantidad debe ser un entero mayor a cero y no superar la cantidad pedida.");

    const nextNumber = Math.max(0, ...remits.map(existing => Number(existing.number.slice(-8)) || 0)) + 1;
    const number = isNew ? `R-0001-${nextNumber.toString().padStart(8, "0")}` : remit.number;

    onSave({
      id: isNew ? `rem-${Date.now()}` : remit.id,
      number,
      date,
      clientId: selectedOrder.clientId,
      orderId,
      items,
      status,
      observations,
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <SalesFormHeader title={isNew ? "Nuevo Remito" : `Editar Remito ${remit.number}`} onCancel={onCancel} />

      {errorMsg && (
        <div role="alert" className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">
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
                <label htmlFor="remit-order" className="block text-sm font-medium text-gray-700">Pedido asociado *</label>
                <select
                  id="remit-order"
                  required
                  value={orderId}
                  onChange={e => setOrderId(e.target.value)}
                  disabled={!isNew}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Seleccionar pedido...</option>
                  {isNew && availableOrders.map(o => (
                    <option key={o.id} value={o.id}>{o.number} ({o.date})</option>
                  ))}
                  {!isNew && <option value={orderId}>{SAMPLE_ORDERS.find(o => o.id === orderId)?.number}</option>}
                </select>
              </div>

              <div>
                <label htmlFor="remit-date" className="block text-sm font-medium text-gray-700">Fecha de emisión *</label>
                <input
                  id="remit-date"
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              {selectedClient && (
                <div className="sm:col-span-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 border border-gray-100">
                  <p><span className="font-medium">Cliente:</span> {selectedClient.name}</p>
                  <p><span className="font-medium">{selectedClient.documentType}:</span> {selectedClient.cuitCuil || "N/A"}</p>
                  <p><span className="font-medium">Dirección del cliente:</span> {formatClientAddress(selectedClient) || "N/A"}</p>
                  {orderId && SAMPLE_ORDERS.find(o => o.id === orderId)?.deliveryAddressType === "custom" && <p className="mt-2 text-purple-700 font-medium">Entrega en domicilio alternativo: {SAMPLE_ORDERS.find(o => o.id === orderId)?.customDeliveryAddress}</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Mercadería a entregar</h2>
          </div>
          <div className="p-5">
            {items.length === 0 ? (
              <p className="text-sm text-gray-500">Selecciona un pedido para cargar los renglones.</p>
            ) : (
              <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {items.map((item, index) => (
                  <div key={item.id} className="grid gap-3 p-3 text-sm sm:grid-cols-[minmax(0,1fr)_7rem_10rem] sm:items-center">
                    <p className="min-w-0 break-words font-medium text-gray-900">{item.productName}</p>
                    <p className="text-gray-600">Pedido: {selectedOrder?.items[index]?.quantity ?? item.quantity}</p>
                    <label htmlFor={`remit-quantity-${item.id}`} className="flex items-center justify-between gap-2 sm:flex-col sm:items-start">
                      <span className="text-gray-600">A entregar</span>
                      <input
                        id={`remit-quantity-${item.id}`}
                        type="number"
                        min="1"
                        max={selectedOrder?.items[index]?.quantity}
                        step="1"
                        value={item.quantity}
                        onChange={e => handleQuantityChange(item.id, Number(e.target.value))}
                        className="w-20 rounded-md border border-gray-400 bg-white px-2 py-1 text-right text-sm font-semibold text-gray-950 shadow-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                      />
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Observaciones</h2>
          </div>
          <div className="p-5">
            <label htmlFor="remit-observations" className="mb-1 block text-sm font-medium text-gray-700">Aclaraciones sobre la entrega</label>
            <textarea
              id="remit-observations"
              rows={3}
              value={observations}
              onChange={e => setObservations(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              placeholder="Aclaraciones sobre la entrega..."
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancelar</button>
          <button type="button" onClick={() => handleSubmit("Borrador")} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50">Guardar Borrador</button>
          <button type="button" onClick={() => handleSubmit("Despachado")} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700">Despachar</button>
        </div>
      </form>
    </div>
  );
}

type RemitDetailProps = {
  remit: Remit;
  notice: string;
  onClose: () => void;
  onEdit: () => void;
  onChangeStatus: (s: RemitStatus) => void;
};

function RemitDetail({ remit, notice, onClose, onEdit, onChangeStatus }: RemitDetailProps) {
  const client = SAMPLE_CLIENTS.find(c => c.id === remit.clientId);
  const order = SAMPLE_ORDERS.find(o => o.id === remit.orderId);
  const customerReturns = SAMPLE_CUSTOMER_RETURNS.filter(customerReturn => customerReturn.remitId === remit.id);
  const hasAvailableReturns = remit.items.some(item => getRemitAvailableQuantity(remit, item.productId) > 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="sticky top-16 z-30 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 py-3">
        <h1 className="min-w-0 break-all text-2xl font-bold text-gray-900">Remito {remit.number}</h1>
        <BackToListButton onClick={onClose} />
      </div>

      {notice && <p role="status" className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Mercadería del remito</h2>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm text-gray-900">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Producto</th>
                    <th className="px-4 py-2 text-right font-medium">Cant. Entregada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {remit.items.map(item => (
                    <tr key={item.id}>
                      <td className="break-words px-4 py-3">{item.productName}</td>
                      <td className="px-4 py-3 text-right font-medium">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {remit.observations && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="text-sm font-semibold text-amber-900">Observaciones</h3>
              <p className="mt-2 text-sm text-amber-800 whitespace-pre-wrap">{remit.observations}</p>
            </div>
          )}

          {customerReturns.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">Devoluciones asociadas</h3>
              <div className="mt-3 space-y-2">
                {customerReturns.map(customerReturn => (
                  <Link key={customerReturn.id} to={`/ventas/devoluciones?devolucion=${encodeURIComponent(customerReturn.id)}`} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 text-sm hover:border-amber-300 hover:bg-amber-50">
                    <span className="font-medium text-amber-800">{customerReturn.number}</span>
                    <span className="text-gray-600">{customerReturn.status} · {customerReturn.items.reduce((total, item) => total + item.quantity, 0)} u.</span>
                  </Link>
                ))}
              </div>
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
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusClass(remit.status)}`}>
                    {remit.status}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">Cliente</dt>
                <dd className="min-w-0 break-words font-medium text-gray-900 text-right">{client?.name || "Desconocido"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Fecha</dt>
                <dd className="font-medium text-gray-900">{remit.date}</dd>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-3">
                <dt className="text-gray-500">Pedido asociado</dt>
                <dd className="font-medium text-purple-700"><Link to={`/ventas/pedidos?pedido=${encodeURIComponent(remit.orderId)}`} className="underline underline-offset-2">{order?.number || remit.orderId}</Link></dd>
              </div>
              {order?.deliveryAddressType === "client" && (
                <div className="border-t border-gray-100 pt-3">
                  <dt className="text-gray-500">Dirección de entrega del cliente</dt>
                  <dd className="break-words font-medium text-gray-900">{client ? formatClientAddress(client) : "No disponible"}</dd>
                </div>
              )}
              {order?.deliveryAddressType === "custom" && (
                <div className="flex justify-between border-t border-gray-100 pt-3 gap-4">
                  <dt className="text-gray-500 whitespace-nowrap">Entrega especial</dt>
                  <dd className="min-w-0 break-words font-medium text-gray-900 text-right">{order.customDeliveryAddress}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-3">
            {remit.status === "Entregado" && hasAvailableReturns && (
              <Link to={`/ventas/devoluciones?remito=${encodeURIComponent(remit.id)}`} className="block w-full rounded-lg bg-amber-700 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800">
                Generar devolución
              </Link>
            )}

            {remit.status === "Entregado" && customerReturns.length > 0 && (
              <Link to={`/ventas/devoluciones?devolucion=${encodeURIComponent(customerReturns[0].id)}`} className="block w-full rounded-lg border border-amber-300 bg-white px-4 py-2 text-center text-sm font-medium text-amber-800 shadow-sm hover:bg-amber-50">
                Consultar devoluciones
              </Link>
            )}

            {remit.status === "Borrador" && (
              <button type="button" onClick={() => onChangeStatus("Despachado")} className="w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 transition">
                Marcar como Despachado
              </button>
            )}

            {remit.status === "Despachado" && (
              <button type="button" onClick={() => onChangeStatus("Entregado")} className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition">
                Confirmar Entrega
              </button>
            )}

            {remit.status === "Borrador" && (
              <button type="button" onClick={onEdit} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition">
                Editar Remito
              </button>
            )}

            {remit.status !== "Anulado" && remit.status !== "Entregado" && (
              <button type="button" onClick={() => { if(confirm("¿Estás seguro de anular este remito?")) onChangeStatus("Anulado"); }} className="w-full rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 transition">
                Anular remito
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Remitos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [remits, setRemits] = useState<Remit[]>(() => [...SAMPLE_REMITS]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos los estados");
  const [notice, setNotice] = useState("");

  const [editingRemit, setEditingRemit] = useState<Remit | null | undefined>(undefined);
  const [selectedRemit, setSelectedRemit] = useState<Remit | null>(null);
  const requestedOrderId = searchParams.get("pedido") || "";
  const requestedRemitId = searchParams.get("remito") || "";

  useEffect(() => {
    if (requestedOrderId) setEditingRemit(null);
  }, [requestedOrderId]);

  useEffect(() => {
    if (requestedRemitId) {
      const requested = SAMPLE_REMITS.find(remit => remit.id === requestedRemitId);
      if (requested) setSelectedRemit(requested);
    }
  }, [requestedRemitId]);

  function closeForm() {
    setEditingRemit(undefined);
    if (requestedOrderId) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("pedido");
      setSearchParams(nextParams, { replace: true });
    }
  }

  function closeDetail() {
    setSelectedRemit(null);
    if (requestedRemitId) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("remito");
      setSearchParams(nextParams, { replace: true });
    }
  }

  const filteredRemits = useMemo(() => {
    return remits.filter(rem => {
      const matchesStatus = statusFilter === "Todos los estados" || rem.status === statusFilter;
      const client = SAMPLE_CLIENTS.find(c => c.id === rem.clientId);
      const order = SAMPLE_ORDERS.find(o => o.id === rem.orderId);
      const searchLower = search.trim().toLowerCase();
      const matchesSearch = !searchLower ||
        rem.number.toLowerCase().includes(searchLower) ||
        (client?.name.toLowerCase().includes(searchLower)) ||
        (order?.number.toLowerCase().includes(searchLower));

      return matchesStatus && matchesSearch;
    });
  }, [remits, search, statusFilter]);

  useEffect(() => {
    if (editingRemit === undefined && selectedRemit === null) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (editingRemit !== undefined) closeForm();
        if (selectedRemit) closeDetail();
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editingRemit, selectedRemit]);

  function saveRemit(rem: Remit) {
    if (SAMPLE_REMITS.some(existing => existing.orderId === rem.orderId && existing.id !== rem.id && existing.status !== "Anulado")) {
      setNotice("Ya existe un remito activo para este pedido.");
      return;
    }
    const isNew = !SAMPLE_REMITS.some(r => r.id === rem.id);
    if (isNew) {
      SAMPLE_REMITS.unshift(rem);
      setNotice("Remito guardado en memoria hasta recargar la aplicación.");
    } else {
      const idx = SAMPLE_REMITS.findIndex(r => r.id === rem.id);
      if (idx >= 0) SAMPLE_REMITS[idx] = rem;
      setNotice("Remito actualizado en memoria hasta recargar la aplicación.");
    }
    setRemits([...SAMPLE_REMITS]);
    closeForm();
    if (selectedRemit && selectedRemit.id === rem.id) {
        setSelectedRemit(rem);
    } else {
        setSelectedRemit(null);
    }
  }

  function changeRemitStatus(status: RemitStatus) {
    if (!selectedRemit) return;
    const allowed = selectedRemit.status === "Borrador" ? ["Despachado", "Anulado"] : selectedRemit.status === "Despachado" ? ["Entregado", "Anulado"] : [];
    if (!allowed.includes(status)) return;
    const updated = { ...selectedRemit, status };
    saveRemit(updated);
  }

  if (editingRemit !== undefined) {
    return <RemitForm remit={editingRemit} remits={remits} initialOrderId={requestedOrderId} onCancel={closeForm} onSave={saveRemit} />;
  }

  if (selectedRemit) {
    return <RemitDetail remit={selectedRemit} notice={notice} onClose={closeDetail} onEdit={() => setEditingRemit(selectedRemit)} onChangeStatus={changeRemitStatus} />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SalesPageHeader
        title="Remitos de Clientes"
        description="Gestión simulada de entregas y remitos asociados a pedidos."
        action={
          <button
            type="button"
            onClick={() => setEditingRemit(null)}
            className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
          >
            + Nuevo Remito
          </button>
        }
      />

      {notice && (
        <div role="status" className="mb-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-200">
          {notice}
        </div>
      )}

      <section className="mt-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-medium text-gray-900">Todos los remitos</h2>
          <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
            <label className="sr-only" htmlFor="remit-search">Buscar remitos</label>
            <input
              id="remit-search"
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por número, pedido o cliente..."
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 sm:w-64"
            />
            <label className="sr-only" htmlFor="remit-status-filter">Filtrar por estado</label>
            <select
              id="remit-status-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            >
              <option>Todos los estados</option>
              {REMIT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {filteredRemits.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-sm text-gray-500">No se encontraron remitos que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <>
            <div className="hidden lg:grid lg:grid-cols-5 items-center gap-4 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <div className="min-w-0 text-center">Número / Fecha</div>
              <div className="min-w-0 text-center">Cliente</div>
              <div className="min-w-0 text-center">Pedido</div>
              <div className="min-w-0 text-center">Estado</div>
              <div className="min-w-0 text-center">Acciones</div>
            </div>
            <div className="divide-y divide-gray-100">
            {filteredRemits.map(remit => {
              const client = SAMPLE_CLIENTS.find(c => c.id === remit.clientId);
              const order = SAMPLE_ORDERS.find(o => o.id === remit.orderId);
              return (
                <article key={remit.id} className="grid min-w-0 grid-cols-2 items-center gap-x-4 gap-y-3 p-4 transition hover:bg-amber-50/30 lg:grid-cols-5 lg:gap-4 lg:px-5">
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="mb-1 text-xs font-medium text-gray-500">{remit.date}</p>
                    <h3 className="break-all font-semibold leading-5 text-gray-900">{remit.number}</h3>
                  </div>
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Cliente</p>
                    <p className="mt-1 break-words text-sm font-medium text-gray-800 lg:mt-0">{client?.name || "Desconocido"}</p>
                  </div>
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Pedido</p>
                    <p className="mt-1 break-words text-sm text-gray-800 lg:mt-0">{order?.number || remit.orderId}</p>
                  </div>
                  <div className="flex flex-col items-start gap-1 lg:items-center">
                    <span className="text-xs font-medium text-gray-500 lg:hidden">Estado</span>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(remit.status)}`}>
                      {remit.status}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2 border-t border-gray-100 pt-2 lg:col-span-1 lg:border-0 lg:pt-0 lg:justify-center">
                    <button type="button" onClick={() => setSelectedRemit(remit)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-600">Ver detalle</button>
                    {remit.status === "Borrador" && (
                      <button type="button" onClick={() => setEditingRemit(remit)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-amber-600">Editar</button>
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
