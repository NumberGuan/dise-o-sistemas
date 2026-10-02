import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";

import { SalesPageHeader } from "~/components/SalesLayout";
import { 
  SAMPLE_CLIENTS, 
  SAMPLE_ORDERS, 
  SAMPLE_REMITS,
  SAMPLE_PRODUCTS, 
  formatClientAddress,
  ORDER_STATUSES, 
  type Client, 
  type Order, 
  type OrderStatus, 
  type OrderItem, 
  type Product 
} from "~/data/sales";
import { SAMPLE_EMPLOYEES } from "~/data/employees";

function getStatusClass(status: OrderStatus) {
  switch (status) {
    case "Pendiente": return "bg-amber-100 text-amber-800";
    case "En preparación": return "bg-sky-100 text-sky-800";
    case "Listo para remito": return "bg-emerald-100 text-emerald-800";
    case "Facturado": return "bg-purple-100 text-purple-800";
    case "Cancelado": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

type OrderFormProps = {
  order: Order | null;
  onCancel: () => void;
  onSave: (order: Order) => void;
};

function OrderForm({ order, onCancel, onSave }: OrderFormProps) {
  const isNew = !order;
  const [clientId, setClientId] = useState(order?.clientId || "");
  const [date, setDate] = useState(order?.date || new Date().toISOString().split("T")[0]);
  const [deliveryDate, setDeliveryDate] = useState(order?.deliveryDate || "");
  const [employeeId, setEmployeeId] = useState(order?.employeeId || "");
  const [deliveryAddressType, setDeliveryAddressType] = useState<"client" | "custom">(order?.deliveryAddressType || "client");
  const [customDeliveryAddress, setCustomDeliveryAddress] = useState(order?.customDeliveryAddress || "");
  const [items, setItems] = useState<OrderItem[]>(order?.items || []);
  const [discount, setDiscount] = useState(order?.discount || 0);
  const [observations, setObservations] = useState(order?.observations || "");
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const selectedClient = SAMPLE_CLIENTS.find(c => c.id === clientId);

  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
  const total = Math.max(0, subtotal - discount);

  function handleAddItem() {
    const product = SAMPLE_PRODUCTS.find(p => p.id === selectedProductId);
    if (!product || quantity <= 0) return;
    
    const newItem: OrderItem = {
      id: `oi-${Date.now()}`,
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
    setItems(items.filter(item => item.id !== id));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!clientId) {
      setErrorMsg("Debe seleccionar un cliente.");
      return;
    }
    if (!employeeId) {
      setErrorMsg("Debe seleccionar un empleado responsable del pedido.");
      return;
    }
    if (deliveryAddressType === "custom" && !customDeliveryAddress.trim()) {
      setErrorMsg("Debe ingresar la dirección alternativa de entrega.");
      return;
    }
    if (items.length === 0) {
      setErrorMsg("Debe agregar al menos un producto al pedido.");
      return;
    }
    
    const nextNumber = isNew ? Math.floor(Math.random() * 10000) : parseInt(order.number.split("-")[1], 10);
    const orderNumber = isNew ? `PC-${String(nextNumber).padStart(6, "0")}` : order.number;
    
    onSave({
      id: order?.id || `o-${Date.now()}`,
      number: orderNumber,
      clientId,
      employeeId,
      date,
      deliveryDate,
      deliveryAddressType,
      customDeliveryAddress: deliveryAddressType === "custom" ? customDeliveryAddress : undefined,
      items,
      subtotal,
      discount,
      total,
      status: order?.status || "Pendiente",
      observations
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm sm:p-6">
      <div className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isNew ? "Nuevo Pedido" : `Editar Pedido ${order.number}`}
          </h2>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-500">
            <span className="sr-only">Cerrar</span>✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {errorMsg && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 border border-red-200">
              {errorMsg}
            </div>
          )}
          <form id="order-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cliente *</label>
                  <select
                    required
                    value={clientId}
                    onChange={e => {
                      setClientId(e.target.value);
                      setDeliveryAddressType("client");
                      setCustomDeliveryAddress("");
                    }}
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  >
                    <option value="">Seleccionar cliente...</option>
                    {SAMPLE_CLIENTS.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                
                {selectedClient && (
                  <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 border border-gray-100">
                    <p><span className="font-medium">{selectedClient.documentType}:</span> {selectedClient.cuitCuil || "N/A"}</p>
                    <p><span className="font-medium">Condición fiscal:</span> {selectedClient.ivaType || "N/A"}</p>
                  </div>
                )}
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Empleado responsable *</label>
                  <select
                    required
                    value={employeeId}
                    onChange={e => setEmployeeId(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  >
                    <option value="">Seleccionar empleado...</option>
                    {SAMPLE_EMPLOYEES.filter(e => e.status === "Activo").map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de emisión *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de entrega</label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={e => setDeliveryDate(e.target.value)}
                      className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dirección de entrega</label>
                  <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm text-gray-700">
                      Predeterminada: <span className="font-medium text-gray-900">{selectedClient ? formatClientAddress(selectedClient) || "No disponible" : "Seleccione un cliente"}</span>
                    </p>
                    <label className="mt-3 flex items-center gap-2 text-sm text-gray-900 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={deliveryAddressType === "custom"}
                        onChange={(e) => setDeliveryAddressType(e.target.checked ? "custom" : "client")}
                        className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="font-medium">Ingresar una dirección de entrega distinta para este pedido</span>
                    </label>
                    {deliveryAddressType === "custom" && (
                      <div className="pt-2">
                        <input
                          type="text"
                          value={customDeliveryAddress}
                          onChange={e => setCustomDeliveryAddress(e.target.value)}
                          placeholder="Ej: Av. Corrientes 1234, CABA"
                          className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-gray-50 p-4">
                <h3 className="text-sm font-medium text-gray-900">Productos</h3>
                <div className="mt-3 flex flex-wrap items-end gap-3">
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
                      value={quantity}
                      onChange={e => setQuantity(parseInt(e.target.value, 10))}
                      className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
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

              {items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-900">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-4 py-2 font-medium">Producto</th>
                        <th className="px-4 py-2 text-right font-medium">Cant.</th>
                        <th className="px-4 py-2 text-right font-medium">Precio</th>
                        <th className="px-4 py-2 text-right font-medium">Subtotal</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2">{item.productName}</td>
                          <td className="px-4 py-2 text-right">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">${item.unitPrice}</td>
                          <td className="px-4 py-2 text-right font-medium text-gray-900">${item.subtotal}</td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-500 hover:text-red-700"
                              title="Eliminar producto"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-gray-500">
                  No hay productos en el pedido.
                </div>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                <textarea
                  rows={4}
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                  placeholder="Notas internas, condiciones de entrega..."
                  className="mt-1 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>
              
              <div className="rounded-lg bg-gray-50 p-5 shadow-inner flex flex-col gap-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">${subtotal}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 items-center">
                  <span>Descuento ($)</span>
                  <input 
                    type="number"
                    min="0"
                    max={subtotal}
                    value={discount}
                    onChange={e => setDiscount(Number(e.target.value))}
                    className="h-8 w-24 rounded-md border border-gray-300 bg-white px-2 text-right text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
                <div className="mt-2 border-t border-gray-200 pt-3 flex justify-between font-bold text-lg text-gray-900">
                  <span>Total</span>
                  <span>${total}</span>
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            Cancelar
          </button>
          <button type="submit" form="order-form" className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">
            {isNew ? "Guardar Pedido" : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

type OrderDetailsProps = {
  order: Order;
  client: Client | undefined;
  onClose: () => void;
  onEdit: () => void;
  onChangeStatus: (status: OrderStatus) => void;
};

function OrderDetails({ order, client, onClose, onEdit, onChangeStatus }: OrderDetailsProps) {
  const activeRemit = SAMPLE_REMITS.find(remit => remit.orderId === order.id && remit.status !== "Anulado");
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/50 backdrop-blur-sm transition-opacity">
      <div className="flex w-full max-w-md flex-col bg-white shadow-2xl h-full animate-slide-left overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Pedido {order.number}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition">
            <span className="sr-only">Cerrar</span>✕
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${getStatusClass(order.status)}`}>
              {order.status}
            </span>
            <span className="text-sm font-medium text-gray-500">{order.date}</span>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Datos del Cliente y Venta</h3>
            <p className="font-semibold text-gray-900 text-base">{client?.name || "Cliente desconocido"}</p>
            {client && (
              <div className="mt-3 grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-600">
                <p><span className="font-medium text-gray-700">{client.documentType}:</span> {client.cuitCuil || "-"}</p>
                <p><span className="font-medium text-gray-700">IVA:</span> {client.ivaType || "-"}</p>
                <p className="col-span-2"><span className="font-medium text-gray-700">Localidad:</span> {client.locality}</p>
              </div>
            )}
            <div className="mt-3 border-t border-gray-200 pt-3 text-sm text-gray-600">
              <p><span className="font-medium text-gray-700">Vendedor:</span> {order.employeeId ? SAMPLE_EMPLOYEES.find(e => e.id === order.employeeId)?.name : "No asignado"}</p>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Productos</h3>
            <ul className="divide-y divide-gray-100 border-y border-gray-100">
              {order.items.map(item => (
                <li key={item.id} className="flex justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="text-gray-500 mt-0.5">{item.quantity} uni. x ${item.unitPrice}</p>
                  </div>
                  <div className="font-medium text-gray-900">${item.subtotal}</div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col items-end gap-1.5 text-sm">
              <p className="text-gray-500">Subtotal: ${order.subtotal}</p>
              {order.discount > 0 && <p className="text-red-600 font-medium">Descuento: -${order.discount}</p>}
              <p className="text-lg font-bold text-gray-900 mt-1">Total: ${order.total}</p>
            </div>
          </div>

          {(order.deliveryDate || order.deliveryAddressType) && (
            <div>
              {order.deliveryDate && (
                <>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Entrega Estimada</h3>
              <p className="text-sm font-medium text-gray-800">{order.deliveryDate}</p>
                </>
              )}
              {order.deliveryAddressType && (
                <>
              <h3 className="mt-4 mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Dirección de Entrega</h3>
              <p className="text-sm font-medium text-gray-800">
                {order.deliveryAddressType === "custom" 
                  ? order.customDeliveryAddress 
                  : (client ? formatClientAddress(client) : "Dirección del cliente no disponible")}
                <span className="ml-2 text-xs font-normal text-gray-500">
                  ({order.deliveryAddressType === "custom" ? "Alternativa" : "Del cliente"})
                </span>
              </p>
                </>
              )}
            </div>
          )}

          {order.observations && (
            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Observaciones</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap rounded-lg bg-yellow-50/50 p-3 border border-yellow-100">{order.observations}</p>
            </div>
          )}

        </div>
        
        <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-3">
          {(activeRemit || order.status === "Listo para remito" || order.status === "Facturado") && (
            <Link to={activeRemit ? `/ventas/remitos?remito=${encodeURIComponent(activeRemit.id)}` : `/ventas/remitos?pedido=${encodeURIComponent(order.id)}`} className="block w-full rounded-lg bg-amber-600 px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm hover:bg-amber-700">
              {activeRemit ? `Consultar remito ${activeRemit.number}` : "Generar remito"}
            </Link>
          )}
          {order.status !== "Cancelado" && order.status !== "Facturado" && !activeRemit && (
            <button type="button" onClick={onEdit} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition">
              Editar Pedido
            </button>
          )}
          
          {order.status === "Pendiente" && (
            <button type="button" onClick={() => onChangeStatus("En preparación")} className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-sky-700 transition">
              Pasar a "En preparación"
            </button>
          )}

          {order.status === "En preparación" && (
            <button type="button" onClick={() => onChangeStatus("Listo para remito")} className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition">
              Marcar como Listo
            </button>
          )}

          

          {order.status !== "Cancelado" && order.status !== "Facturado" && !activeRemit && (
            <button type="button" onClick={() => {
              if (confirm("¿Está seguro que desea cancelar este pedido?")) {
                onChangeStatus("Cancelado");
              }
            }} className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 transition">
              Cancelar Pedido
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Pedidos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>(() => [...SAMPLE_ORDERS]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Todos los estados");
  const [notice, setNotice] = useState("");

  const [editingOrder, setEditingOrder] = useState<Order | null | undefined>(undefined);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter(order => {
      const client = SAMPLE_CLIENTS.find(c => c.id === order.clientId);
      const clientName = client?.name.toLowerCase() || "";
      const matchesSearch = !query || order.number.toLowerCase().includes(query) || clientName.includes(query);
      const matchesStatus = statusFilter === "Todos los estados" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  useEffect(() => {
    if (editingOrder === undefined && selectedOrder === null) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setEditingOrder(undefined);
        closeOrderDetails();
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editingOrder, selectedOrder, searchParams]);

  useEffect(() => {
    const orderId = searchParams.get("pedido");
    if (!orderId) return;
    const order = orders.find(candidate => candidate.id === orderId);
    if (order) setSelectedOrder(order);
  }, [orders, searchParams]);

  function closeOrderDetails() {
    setSelectedOrder(null);
    if (searchParams.has("pedido")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("pedido");
      setSearchParams(nextParams, { replace: true });
    }
  }

  function saveOrder(order: Order) {
    const isNew = !SAMPLE_ORDERS.some(o => o.id === order.id);
    if (isNew) {
      SAMPLE_ORDERS.unshift(order);
      setNotice("Pedido registrado en memoria hasta recargar la aplicación.");
    } else {
      const orderIndex = SAMPLE_ORDERS.findIndex(o => o.id === order.id);
      if (orderIndex >= 0) SAMPLE_ORDERS[orderIndex] = order;
      setNotice("Pedido actualizado en memoria hasta recargar la aplicación.");
    }
    setOrders([...SAMPLE_ORDERS]);
    setEditingOrder(undefined);
    if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder(order);
    } else {
        setSelectedOrder(null);
    }
  }

  function changeOrderStatus(status: OrderStatus) {
    if (!selectedOrder) return;
    const updated = { ...selectedOrder, status };
    saveOrder(updated);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SalesPageHeader 
        title="Pedidos de Clientes" 
        description="Alta, seguimiento y preparación de pedidos realizados por clientes." 
        action={
          <button 
            type="button" 
            onClick={() => setEditingOrder(null)} 
            className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
          >
            + Nuevo pedido
          </button>
        } 
      />

      {notice && (
        <p role="status" className="mt-5 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
          <button type="button" onClick={() => setNotice("")} className="font-medium underline hover:text-emerald-900">Cerrar</button>
        </p>
      )}

      <section className="mt-7 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Listado de pedidos</h2>
            <p className="mt-1 text-sm text-gray-500">{filteredOrders.length} {filteredOrders.length === 1 ? "pedido encontrado" : "pedidos encontrados"}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:flex">
            <input 
              type="search" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Buscar por número o cliente..." 
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 sm:w-64" 
            />
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)} 
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            >
              <option>Todos los estados</option>
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <h3 className="mt-4 font-semibold text-gray-900">No encontramos pedidos</h3>
            <p className="mt-1 text-sm text-gray-500">Prueba con otro término o cambia los filtros.</p>
            <button type="button" onClick={() => { setSearch(""); setStatusFilter("Todos los estados"); }} className="mt-4 text-sm font-semibold text-amber-700 hover:text-amber-800">Limpiar filtros</button>
          </div>
        ) : (
          <>
            <div className="hidden lg:grid lg:grid-cols-5 items-center gap-5 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <div className="min-w-0 text-center">Número / Fecha</div>
              <div className="min-w-0 text-center">Cliente</div>
              <div className="min-w-0 text-center">Total</div>
              <div className="min-w-0 text-center">Estado</div>
              <div className="min-w-0 text-center">Acciones</div>
            </div>
            <div className="divide-y divide-gray-100">
            {filteredOrders.map(order => {
              const client = SAMPLE_CLIENTS.find(c => c.id === order.clientId);
              return (
                <article key={order.id} className="grid min-w-0 grid-cols-2 items-center gap-x-4 gap-y-3 p-4 transition hover:bg-amber-50/30 lg:grid-cols-5 lg:gap-5 lg:px-5">
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="mb-1 text-xs font-medium text-gray-500">{order.date}</p>
                    <h3 className="font-semibold leading-5 text-gray-900">{order.number}</h3>
                  </div>
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Cliente</p>
                    <p className="mt-1 break-words text-sm font-medium text-gray-800 lg:mt-0">{client?.name || "Desconocido"}</p>
                  </div>
                  <div className="min-w-0 lg:text-center text-left">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Total</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 lg:mt-0">${order.total}</p>
                  </div>
                  <div className="flex flex-col items-start gap-1 lg:items-center">
                    <span className="text-xs font-medium text-gray-500 lg:hidden">Estado</span>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2 border-t border-gray-100 pt-2 lg:col-span-1 lg:border-0 lg:pt-0 lg:justify-center">
                    <button type="button" onClick={() => setSelectedOrder(order)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-600">Ver detalle</button>
                    {order.status !== "Cancelado" && order.status !== "Facturado" && !SAMPLE_REMITS.some(remit => remit.orderId === order.id && remit.status !== "Anulado") && (
                      <button type="button" onClick={() => setEditingOrder(order)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-amber-600">Editar</button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          </>
        )}
      </section>

      {editingOrder !== undefined && (
        <OrderForm 
          order={editingOrder} 
          onCancel={() => setEditingOrder(undefined)} 
          onSave={saveOrder} 
        />
      )}
      {selectedOrder && (
        <OrderDetails 
          order={selectedOrder} 
          client={SAMPLE_CLIENTS.find(c => c.id === selectedOrder.clientId)}
          onClose={closeOrderDetails}
          onEdit={() => { setEditingOrder(selectedOrder); closeOrderDetails(); }}
          onChangeStatus={changeOrderStatus}
        />
      )}
    </div>
  );
}

