import { useState } from "react";
import { Form, Link, useNavigation } from "react-router";

import { CatalogOptions, useCatalogs } from "~/components/CatalogProvider";
import { deliveryNeedsAddress } from "~/data/catalogs";
import { formatClientAddress, SAMPLE_PRODUCTS, type ClientAddress, type Order } from "~/data/sales";

type OrderLineDraft = {
  id?: string;
  productId: string;
  productName: string;
  quantity: string;
  maxQuantity: number;
};

export default function CustomerOrderEditor({ order, addresses, version, detailUrl }: {
  order: Pick<Order, "id" | "fulfillment" | "kind" | "deliveryAddress" | "deliveryAddressId" | "items" | "observations">;
  addresses: ClientAddress[];
  version: string;
  detailUrl: string;
}) {
  const catalogs = useCatalogs();
  const navigation = useNavigation();
  const isSaving = navigation.state !== "idle";
  const initialFulfillment = order.fulfillment ?? (order.kind === "Mostrador" ? "Retiro en local" : "Envío");
  const canKeepAddress = deliveryNeedsAddress(catalogs, initialFulfillment) && Boolean(order.deliveryAddress);
  const [fulfillment, setFulfillment] = useState(initialFulfillment);
  const [addressId, setAddressId] = useState(canKeepAddress ? "" : addresses.find(address => address.id === order.deliveryAddressId)?.id ?? "");
  const [lines, setLines] = useState<OrderLineDraft[]>(() => order.items.map(item => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    quantity: String(item.quantity),
    maxQuantity: Math.max(100000, item.quantity),
  })));
  const [productId, setProductId] = useState("");
  const availableProducts = SAMPLE_PRODUCTS.filter(product => !lines.some(line => line.productId === product.id));
  const editProducts = order.kind !== "Evento";
  const inputClass = "mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-2 focus-visible:outline-amber-700";
  const labelClass = "block text-sm font-semibold text-gray-800";

  function addProduct() {
    const product = availableProducts.find(item => item.id === productId);
    if (!product) return;
    const original = order.items.find(item => item.productId === product.id);
    setLines(current => [...current, { id: original?.id, productId: product.id, productName: original?.productName ?? product.name, quantity: "1", maxQuantity: Math.max(100000, original?.quantity ?? 0) }]);
    setProductId("");
  }

  return (
    <Form method="post" className="shop-panel space-y-6 rounded-2xl border p-4 sm:p-6">
      <input type="hidden" name="intent" value="edit-order" />
      <input type="hidden" name="orderId" value={order.id} />
      <input type="hidden" name="version" value={version} />
      {!editProducts && <p className="text-sm text-gray-600">Los productos y la seña del evento se gestionan en Ventas.</p>}
      <fieldset disabled={isSaving} className="min-w-0 space-y-5">
        <legend className="mb-3 shop-heading font-semibold">Entrega</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Modalidad de entrega
            <select name="fulfillment" value={fulfillment} onChange={event => setFulfillment(event.target.value)} className={inputClass}>
              <CatalogOptions catalog="modalidades-entrega" retained={initialFulfillment} />
            </select>
          </label>
          {deliveryNeedsAddress(catalogs, fulfillment) && (
            <label className={labelClass}>
              Dirección de entrega
              <select name="deliveryAddressId" value={addressId} onChange={event => setAddressId(event.target.value)} required={!canKeepAddress} className={inputClass}>
                <option value="">{canKeepAddress ? `Mantener: ${order.deliveryAddress}` : "Seleccioná una dirección"}</option>
                {addresses.map(address => <option key={address.id} value={address.id}>{address.label} · {formatClientAddress(address)}</option>)}
              </select>
              {addresses.length === 0 && !canKeepAddress && <span className="mt-1 block font-normal text-gray-600">Podés guardar una dirección desde <Link to="/compras/perfil" className="underline">Mi perfil</Link>.</span>}
            </label>
          )}
        </div>
        <label className={labelClass}>
          Observaciones del pedido
          <textarea name="observations" defaultValue={order.observations} rows={3} maxLength={2000} className={inputClass} />
        </label>
      </fieldset>

      {editProducts && (
        <fieldset disabled={isSaving} className="min-w-0 space-y-4 shop-rule border-t pt-4">
          <legend className="float-left mb-3 w-full shop-heading font-semibold">Productos</legend>
          <input type="hidden" name="items" value={JSON.stringify(lines.map(line => ({ id: line.id, productId: line.productId, quantity: Number(line.quantity) })))} />
          <ul className="clear-both shop-divide divide-y">
            {lines.map((line, index) => (
              <li key={line.id ?? line.productId} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2">
                <span className="min-w-32 flex-1 text-sm font-medium text-gray-800">{line.productName}</span>
                <input aria-label={`Cantidad de ${line.productName}`} type="number" required min={1} max={line.maxQuantity} step={1} value={line.quantity} onChange={event => setLines(current => current.map((item, position) => position === index ? { ...item, quantity: event.target.value } : item))} className="h-10 w-24 rounded-lg border border-gray-300 px-2 text-sm" />
                <button type="button" aria-label={`Quitar ${line.productName}`} onClick={() => setLines(current => current.filter((_, position) => position !== index))} className="min-h-10 px-1 text-sm font-semibold text-red-700 hover:underline">Quitar</button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-end gap-3">
            <label className={`${labelClass} min-w-40 flex-1`}>Agregar producto
              <select value={productId} onChange={event => setProductId(event.target.value)} className={inputClass}>
                <option value="">Seleccioná un producto</option>
                {availableProducts.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
              </select>
            </label>
            <button type="button" disabled={!productId || lines.length >= Math.max(100, order.items.length)} onClick={addProduct} className="shop-secondary min-h-11 px-4 text-sm font-semibold disabled:opacity-50">Agregar</button>
          </div>
          {lines.length === 0 && <p className="text-sm text-gray-600">Agregá al menos un producto para guardar.</p>}
        </fieldset>
      )}

      <div className="flex flex-wrap justify-end gap-3 shop-rule border-t pt-4">
        <Link to={detailUrl} className="inline-flex shop-secondary min-h-11 items-center px-4 text-sm font-semibold">Cancelar</Link>
        <button type="submit" disabled={isSaving || (editProducts && !lines.length)} className="min-h-11 shop-primary px-5 text-sm font-semibold text-white disabled:opacity-50">{isSaving ? "Guardando…" : "Guardar cambios"}</button>
      </div>
    </Form>
  );
}
