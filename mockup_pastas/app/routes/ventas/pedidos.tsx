import PrintVoucher from "~/components/PrintVoucher";
import { CatalogField } from "~/components/InlineCatalog";
import { CatalogOptions, useCatalogs } from "~/components/CatalogProvider";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, redirect, useFetcher, useLoaderData, useRevalidator, useSearchParams } from "react-router";
import { deliveryNeedsAddress, catalogOptions, catalogDefaultValue } from "~/data/catalogs";
import { currentSalesDate, invoiceAmounts } from "~/data/billing";

import { SalesFormHeader, SalesPageHeader } from "~/components/SalesLayout";
import { 
  SAMPLE_REMITS,
  SAMPLE_PRODUCTS, 
  formatClientAddress,
  getClientAddresses,
  ORDER_STATUSES, 
  ORDER_KINDS,
  COUNTER_CLIENT,
  type OrderKind,
  type PaymentMethod,
  type Client, 
  type Order, 
  type OrderStatus, 
  type OrderItem, 
  type Product 
} from "~/data/sales";
import { SAMPLE_EMPLOYEES } from "~/data/employees";
import { changeSalesOrderStatus, getSalesData, saveSalesOrder } from "~/data/sales.server";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/pedidos";

const currency = (amount: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);

export const loader = async ({ request }: Route.LoaderArgs) => {
  await requireUserAndRole(request, ["Ventas"]);
  return getSalesData();
};

export const action = async ({ request }: Route.ActionArgs) => {
  const actor = await requireUserAndRole(request, ["Ventas"]);
  const formData = await request.formData();
  const intent = formData.get("intent");
  try {
    if (intent === "save-order") {
      const raw = formData.get("order");
      if (typeof raw !== "string") throw new Error("Los datos del pedido no son válidos.");
      const id = formData.get("id");
      if (id !== null && (typeof id !== "string" || id.length > 120)) throw new Error("El identificador del pedido no es válido.");
      const saved = await saveSalesOrder(JSON.parse(raw), id || undefined, actor);
      if (formData.get("invoice") === "yes") return redirect(`/ventas/comprobantes?pedido=${encodeURIComponent(saved.id)}`);
      return { success: true, intent };
    }
    if (intent === "change-status") {
      const id = formData.get("id");
      if (typeof id !== "string" || id.length > 120) throw new Error("El identificador del pedido no es válido.");
      await changeSalesOrderStatus(id, formData.get("status"));
      return { success: true, intent };
    }
    return { error: "La acción solicitada no está disponible." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo guardar el pedido." };
  }
};

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
  clients: Client[];
  onCancel: () => void;
  onSave: (order: Order & { deposit?: { amount: number; method: PaymentMethod; reference: string } }, invoice: boolean) => void;
  pending: boolean;
};

function OrderForm({ order, clients, onCancel, onSave, pending }: OrderFormProps) {
  const catalogs = useCatalogs();
  const isNew = !order;
  const { receipts, cashSessions } = useLoaderData<typeof loader>();
  const [kind, setKind] = useState<OrderKind>(order?.kind ?? "Regular");
  const [fulfillment, setFulfillment] = useState(order?.fulfillment ?? catalogDefaultValue(catalogs, "modalidades-entrega", "Envío"));
  const [deliveryTime, setDeliveryTime] = useState(order?.deliveryTime ?? "");
  const existingDeposit = order ? receipts.find(receipt => receipt.advanceOrderId === order.id && receipt.status === "Registrado") : undefined;
  const [depositAmount, setDepositAmount] = useState<number | "">(existingDeposit?.total ?? "");
  const [depositMethod, setDepositMethod] = useState<PaymentMethod>(catalogOptions(catalogs, "medios-pago")[0]?.value ?? "");
  const [depositReference, setDepositReference] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [clientId, setClientId] = useState(order?.clientId === COUNTER_CLIENT.id ? "" : order?.clientId || "");
  const [date, setDate] = useState(order?.date || currentSalesDate());
  const [deliveryDate, setDeliveryDate] = useState(order?.deliveryDate || "");
  const [employeeId, setEmployeeId] = useState(order?.employeeId || "");
  const [deliveryAddressType, setDeliveryAddressType] = useState<"client" | "custom">(order?.deliveryAddressType || "client");
  const [addressId, setAddressId] = useState(order?.deliveryAddressId ?? getClientAddresses(clients.find(client => client.id === order?.clientId) ?? { id: "", street: "", streetNumber: "", locality: "", province: "" })[0]?.id ?? "");
  const [customDeliveryAddress, setCustomDeliveryAddress] = useState(order?.customDeliveryAddress || "");
  const [items, setItems] = useState<OrderItem[]>(order?.items || []);
  const [discount, setDiscount] = useState(order?.discount || 0);
  const [observations, setObservations] = useState(order?.observations || "");
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const selectedClient = clients.find(c => c.id === clientId);
  const addresses = selectedClient ? getClientAddresses(selectedClient) : [];
  const selectedAddressId = addressId || addresses[0]?.id || "";

  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
  const total = Math.max(0, subtotal - discount);
  const finalAmounts = invoiceAmounts(items, selectedClient?.type ?? "Particular", discount);
  const minimumDeposit = Math.ceil(Math.round(finalAmounts.total * 100) / 2) / 100;

  function handleAddItem() {
    const product = SAMPLE_PRODUCTS.find(p => p.id === selectedProductId);
    if (!product || quantity <= 0) return;
    
    addProduct(product, quantity);
    setSelectedProductId("");
    setQuantity(1);
  }

  function addProduct(product: Product, count = 1) {
    const newItem: OrderItem = {
      id: `oi-${crypto.randomUUID()}`,
      productId: product.id,
      productName: product.name,
      quantity: count,
      unitPrice: product.price,
      subtotal: product.price * count
    };
    setItems(current => {
      const existing = current.find(item => item.productId === product.id);
      return existing ? current.map(item => item.id === existing.id ? { ...item, quantity: item.quantity + count, subtotal: (item.quantity + count) * item.unitPrice } : item) : [...current, newItem];
    });
    setErrorMsg("");
  }

  function handleRemoveItem(id: string) {
    setItems(items.filter(item => item.id !== id));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!clientId && kind !== "Mostrador") {
      setErrorMsg("Debe seleccionar un cliente.");
      return;
    }
    if (!employeeId) {
      setErrorMsg("Debe seleccionar un empleado responsable del pedido.");
      return;
    }
    if (deliveryNeedsAddress(catalogs, fulfillment) && deliveryAddressType === "custom" && !customDeliveryAddress.trim()) {
      setErrorMsg("Debe ingresar la dirección alternativa de entrega.");
      return;
    }
    if (items.length === 0) {
      setErrorMsg("Debe agregar al menos un producto al pedido.");
      return;
    }
    if (kind === "Evento" && (!deliveryDate || !deliveryTime)) return setErrorMsg("Completá el día y la hora del evento.");
    const paidDeposit = existingDeposit?.total ?? (depositAmount === "" ? minimumDeposit : depositAmount);
    if (kind === "Evento" && (paidDeposit < minimumDeposit || paidDeposit > finalAmounts.total)) return setErrorMsg("La seña debe cubrir al menos el 50% y no superar el total final.");
    
    const nextNumber = isNew ? Math.floor(Math.random() * 10000) : parseInt(order.number.split("-")[1], 10);
    const orderNumber = isNew ? `PC-${String(nextNumber).padStart(6, "0")}` : order.number;
    
    onSave({
      id: order?.id || `o-${Date.now()}`,
      number: orderNumber,
      clientId: clientId || COUNTER_CLIENT.id,
      kind,
      fulfillment,
      deliveryTime,
      deposit: kind === "Evento" ? { amount: paidDeposit, method: depositMethod, reference: depositReference } : undefined,
      employeeId,
      date,
      deliveryDate,
      deliveryAddressType,
      deliveryAddressId: selectedAddressId,
      customDeliveryAddress: deliveryAddressType === "custom" ? customDeliveryAddress : undefined,
      items,
      subtotal,
      discount,
      total,
      status: order?.status || "Pendiente",
      observations
    }, (e.nativeEvent as SubmitEvent).submitter instanceof HTMLButtonElement && ((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement).value === "invoice");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <SalesFormHeader title={isNew ? "Nuevo Pedido" : `Editar Pedido ${order.number}`} onCancel={onCancel} pending={pending} />
      {kind === "Evento" && !existingDeposit && !cashSessions.some(session => !session.closedAt) && <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Necesitás una caja abierta para cobrar la seña del evento. <Link to="/ventas/caja" className="font-semibold underline">Abrir caja</Link></p>}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {errorMsg && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 border border-red-200">
              {errorMsg}
            </div>
          )}
          <form noValidate id="order-form" onSubmit={handleSubmit} className="space-y-6">
            <label className="block text-sm font-medium text-gray-700">Tipo de pedido
              <select value={kind} disabled={!isNew} onChange={event => { const next = event.target.value as OrderKind; setKind(next); setFulfillment(next === "Mostrador" ? "Retiro en local" : "Envío"); if (clientId === COUNTER_CLIENT.id) setClientId(""); }} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3">
                {ORDER_KINDS.map(type => <option key={type}>{type}</option>)}
              </select>
            </label>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label htmlFor="order-client" className="block text-sm font-medium text-gray-700">{kind === "Mostrador" ? "Cliente (opcional)" : "Cliente *"}</label>
                  <select
                    id="order-client"
                    required={kind !== "Mostrador"}
                    value={clientId}
                    onChange={e => {
                      setClientId(e.target.value);
                      setAddressId("");
                      setDeliveryAddressType("client");
                      setCustomDeliveryAddress("");
                    }}
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  >
                    <option value="">{kind === "Mostrador" ? "Consumidor final · sin seleccionar cliente" : "Seleccionar cliente..."}</option>
                    {clients.filter((client) => client.status === "Activo" && client.id !== COUNTER_CLIENT.id).map(c => (
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
                  <label htmlFor="order-employee" className="block text-sm font-medium text-gray-700">Empleado responsable *</label>
                  <select
                    id="order-employee"
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
                    <label htmlFor="order-delivery-date" className="block text-sm font-medium text-gray-700">{kind === "Evento" ? "Día de retiro o envío *" : "Fecha de entrega"}</label>
                    <input
                      id="order-delivery-date"
                      type="date"
                      required={kind === "Evento"}
                      min={kind === "Evento" ? date : undefined}
                      value={deliveryDate}
                      onChange={e => setDeliveryDate(e.target.value)}
                      className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                </div>

                {kind === "Evento" && <label className="block text-sm font-medium text-gray-700">Hora de retiro o envío *<input type="time" required value={deliveryTime} onChange={event => setDeliveryTime(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3" /></label>}
                <label className="block text-sm font-medium text-gray-700">Modalidad de entrega
                  <CatalogField catalog="modalidades-entrega" onCreated={entry => setFulfillment(entry.value)} disabled={pending}><select value={fulfillment} onChange={event => setFulfillment(event.target.value as typeof fulfillment)} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3"><CatalogOptions catalog="modalidades-entrega" retained={order?.fulfillment} /></select></CatalogField>
                </label>

                {deliveryNeedsAddress(catalogs, fulfillment) && <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dirección de entrega</label>
                  <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <label className="block text-sm font-medium text-gray-700">Dirección guardada
                      <select required disabled={deliveryAddressType === "custom" || !selectedClient} value={selectedAddressId} onChange={event => setAddressId(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900">
                        {!addresses.length && <option value="">Sin direcciones guardadas</option>}
                        {order?.deliveryAddress && order.deliveryAddressId && !addresses.some(address => address.id === order.deliveryAddressId) && <option value={order.deliveryAddressId}>Dirección original: {order.deliveryAddress}</option>}
                        {addresses.map((address, index) => <option key={address.id} value={address.id}>{address.label}{index === 0 ? " (principal)" : ""} · {formatClientAddress(address)}</option>)}
                      </select>
                    </label>
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
                          required value={customDeliveryAddress}
                          onChange={e => setCustomDeliveryAddress(e.target.value)}
                          placeholder="Ej: Av. Corrientes 1234, CABA"
                          className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                </div>}
              </div>
            </div>

            <div data-validation-message={items.length ? "" : "Agregá al menos un producto al pedido."} className="rounded-lg border border-gray-200 bg-white shadow-sm">
              {kind === "Mostrador" && <section className="border-b border-gray-200 p-4">
                <label className="block text-sm font-medium">Buscar producto<input type="search" value={productSearch} onChange={event => setProductSearch(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3" placeholder="Nombre del producto..." /></label>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">{SAMPLE_PRODUCTS.filter(product => product.name.toLowerCase().includes(productSearch.toLowerCase())).map(product => <button key={product.id} type="button" onClick={() => addProduct(product)} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-sm hover:bg-amber-100">+ {product.name}<span className="block font-semibold">${product.price}</span></button>)}</div>
                <p className="mt-2 text-xs text-gray-600">Cada clic agrega una unidad. Podés cargar otras cantidades debajo.</p>
              </section>}
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
                      data-validation-skip value={quantity}
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

            {kind === "Evento" && <section className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-5">
              <h2 className="font-semibold">Seña obligatoria del evento</h2>
              <p className="text-sm">Total final con IVA y descuentos: {currency(finalAmounts.total)}. Seña mínima (50%): {currency(minimumDeposit)}.</p>
              {existingDeposit ? <p className="text-sm font-semibold">Seña registrada: {currency(existingDeposit.total)} · {existingDeposit.number}</p> : <>
                <label className="block text-sm">Seña a cobrar *<input type="number" required min={minimumDeposit} max={finalAmounts.total} step="0.01" value={depositAmount === "" ? minimumDeposit : depositAmount} onChange={event => setDepositAmount(event.target.value === "" ? "" : Number(event.target.value))} className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3" /></label>
                <label className="block text-sm">Medio de pago de la seña<CatalogField catalog="medios-pago" onCreated={entry => setDepositMethod(entry.value)} disabled={pending}><select value={depositMethod} onChange={event => setDepositMethod(event.target.value as PaymentMethod)} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3"><CatalogOptions catalog="medios-pago" /></select></CatalogField></label>
                <label className="block text-sm">Referencia de la seña<input value={depositReference} onChange={event => setDepositReference(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3" /></label>
                <p className="text-sm">Al guardar se registra el cobro de la seña. Al emitir la factura se descuenta del saldo a pagar.</p>
              </>}
            </section>}

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
          <button type="submit" name="flow" value="invoice" disabled={pending} form="order-form" className="rounded-lg bg-amber-800 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">Guardar y facturar</button>
          <button type="button" disabled={pending} onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" disabled={pending} form="order-form" className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">
            {pending ? "Guardando…" : isNew ? "Guardar Pedido" : "Guardar Cambios"}
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
  const catalogs = useCatalogs();
  const { invoices, receipts } = useLoaderData<typeof loader>();
  const deposit = receipts.filter(receipt => receipt.advanceOrderId === order.id && receipt.status === "Registrado").reduce((sum, receipt) => sum + receipt.total, 0);
  const activeInvoice = invoices.find(invoice => invoice.orderId === order.id && invoice.status !== "Anulado");
  const activeRemit = SAMPLE_REMITS.find(remit => remit.orderId === order.id && remit.status !== "Anulado");
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <SalesFormHeader title={`Pedido ${order.number}`} onCancel={onClose} action={<PrintVoucher title="Pedido de cliente" document={order} client={client} details={[{ label: "Fecha de entrega", value: order.deliveryDate }, { label: "Dirección de entrega", value: order.deliveryAddress ?? order.customDeliveryAddress ?? "Sin informar" }]} />} />
      <p className="mb-4 text-sm font-semibold text-amber-800">Tipo: {order.kind ?? "Regular"} · {order.fulfillment ?? "Envío"}{order.kind === "Evento" ? ` · ${order.deliveryDate} a las ${order.deliveryTime} · Seña cobrada: ${currency(deposit)}` : ""}</p>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="space-y-6 p-5 sm:p-6">
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
                {order.deliveryAddress || (order.deliveryAddressType === "custom"
                  ? order.customDeliveryAddress 
                  : (client ? formatClientAddress(client) : "Dirección del cliente no disponible"))}
                <span className="ml-2 text-xs font-normal text-gray-500">
                  ({!deliveryNeedsAddress(catalogs, order.fulfillment ?? "Envío") ? "Retiro" : order.deliveryAddressType === "custom" ? "Alternativa" : "Del cliente"})
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
          {(activeInvoice || order.status !== "Cancelado") && (
            <Link to={activeInvoice ? `/ventas/comprobantes?comprobante=${encodeURIComponent(activeInvoice.id)}` : `/ventas/comprobantes?pedido=${encodeURIComponent(order.id)}`} className="block w-full rounded-lg bg-amber-700 px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm hover:bg-amber-800">
              {activeInvoice ? `Consultar factura ${activeInvoice.number}` : "Generar factura"}
            </Link>
          )}
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
  const initialData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();
  const clients = initialData.clients;
  const orders = initialData.orders;
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Todos los estados");
  const [kindFilter, setKindFilter] = useState("Todos los tipos");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");

  const [editingOrder, setEditingOrder] = useState<Order | null | undefined>(undefined);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if ("success" in fetcher.data && fetcher.data.success) {
      setEditingOrder(undefined);
      setSelectedOrder(null);
      setActionError("");
      setNotice("Pedido guardado correctamente.");
      revalidator.revalidate();
    } else if ("error" in fetcher.data) setActionError(fetcher.data.error || "No se pudo guardar el pedido.");
  }, [fetcher.data, fetcher.state, revalidator]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter(order => {
      const client = clients.find(c => c.id === order.clientId);
      const clientName = client?.name.toLowerCase() || "";
      const matchesSearch = !query || order.number.toLowerCase().includes(query) || clientName.includes(query);
      const matchesStatus = statusFilter === "Todos los estados" || order.status === statusFilter;
      return matchesSearch && matchesStatus && (kindFilter === "Todos los tipos" || (order.kind ?? "Regular") === kindFilter);
    }).sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number));
  }, [orders, search, statusFilter, kindFilter, clients]);

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

  function saveOrder(order: Order, invoice = false) {
    const formData = new FormData();
    formData.set("intent", "save-order");
    formData.set("order", JSON.stringify(order));
    if (invoice) formData.set("invoice", "yes");
    if (initialData.orders.some((candidate) => candidate.id === order.id)) formData.set("id", order.id);
    fetcher.submit(formData, { method: "post" });
  }

  function changeOrderStatus(status: OrderStatus) {
    if (!selectedOrder || fetcher.state !== "idle") return;
    const formData = new FormData();
    formData.set("intent", "change-status");
    formData.set("id", selectedOrder.id);
    formData.set("status", status);
    fetcher.submit(formData, { method: "post" });
  }

  if (editingOrder !== undefined) {
    return <>
      {actionError && <p role="alert" className="mx-auto mt-6 max-w-4xl rounded-lg bg-red-50 p-4 text-sm text-red-800">{actionError}</p>}
      <OrderForm order={editingOrder} clients={clients} onCancel={() => setEditingOrder(undefined)} onSave={saveOrder} pending={fetcher.state !== "idle"} />
    </>;
  }

  if (selectedOrder) {
    return <>
      {actionError && <p role="alert" className="mx-auto mt-6 max-w-4xl rounded-lg bg-red-50 p-4 text-sm text-red-800">{actionError}</p>}
      <OrderDetails
        order={selectedOrder}
        client={clients.find(client => client.id === selectedOrder.clientId)}
        onClose={closeOrderDetails}
        onEdit={() => { setEditingOrder(selectedOrder); closeOrderDetails(); }}
        onChangeStatus={changeOrderStatus}
      />
    </>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SalesPageHeader 
        title="Pedidos Clientes"
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

      {(notice || actionError) && (
        <p role={actionError ? "alert" : "status"} className={`mt-5 flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${actionError ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          {actionError || notice}
          <button type="button" onClick={() => { setNotice(""); setActionError(""); }} className="font-medium underline hover:text-emerald-900">Cerrar</button>
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
            <select aria-label="Filtrar por tipo de pedido" value={kindFilter} onChange={event => setKindFilter(event.target.value)} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900"><option>Todos los tipos</option>{ORDER_KINDS.map(kind => <option key={kind}>{kind}</option>)}</select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <h3 className="mt-4 font-semibold text-gray-900">No encontramos pedidos</h3>
            <p className="mt-1 text-sm text-gray-500">Prueba con otro término o cambia los filtros.</p>
            <button type="button" onClick={() => { setSearch(""); setStatusFilter("Todos los estados"); setKindFilter("Todos los tipos"); }} className="mt-4 text-sm font-semibold text-amber-700 hover:text-amber-800">Limpiar filtros</button>
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
              const client = clients.find(c => c.id === order.clientId);
              return (
                <article key={order.id} className="grid min-w-0 grid-cols-2 items-center gap-x-4 gap-y-3 p-4 transition hover:bg-amber-50/30 lg:grid-cols-5 lg:gap-5 lg:px-5">
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="mb-1 text-xs font-medium text-gray-500">{order.date}</p>
                    <h3 className="font-semibold leading-5 text-gray-900">{order.number}</h3>
                    <p className="mt-1 text-xs font-medium text-amber-800">{order.kind ?? "Regular"}{order.kind === "Evento" ? ` · ${order.deliveryDate} ${order.deliveryTime}` : ""}</p>
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



    </div>
  );
}

