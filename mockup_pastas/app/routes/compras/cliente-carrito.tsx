import { Link, useFetcher, useLoaderData } from "react-router";
import { randomUUID } from "node:crypto";

import { SAMPLE_ORDERS, SAMPLE_PRODUCTS, getClientAddresses, formatClientAddress } from "~/data/sales";
import { customerAsClient } from "~/data/customer.server";
import type { CustomerMutationResult } from "~/data/customer.server";
import { requireUserAndRole } from "~/utils/session.server";
import { mutateUser } from "~/utils/db.server";
import type { Route } from "./+types/cliente-carrito";
export { default as ErrorBoundary } from "~/components/CustomerErrorBoundary";

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await requireUserAndRole(request, ["Cliente"]);
  const cart = (user.cart ?? []).map((item) => {
    const product = SAMPLE_PRODUCTS.find((candidate) => candidate.id === item.productId) ?? null;
    const subtotal = product && Number.isSafeInteger(product.price * item.quantity) ? product.price * item.quantity : null;
    return { ...item, product, subtotal };
  });
  let total: number | null = 0;
  for (const item of cart) {
    if (item.subtotal === null || !Number.isSafeInteger((total ?? 0) + item.subtotal)) {
      total = null;
      break;
    }
    total = (total ?? 0) + item.subtotal;
  }

  return {
    cart,
    total,
    totalItems: cart.reduce((sum, item) => Number.isSafeInteger(sum + item.quantity) ? sum + item.quantity : sum, 0),
    isActive: (user.customerStatus ?? "Activo") === "Activo",
    addresses: getClientAddresses(customerAsClient(user)!).filter(address => address.street.trim() && address.locality.trim()),
    hasDeliveryAddress: getClientAddresses(customerAsClient(user)!).some(address => address.street.trim() && address.locality.trim()),
  };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const user = await requireUserAndRole(request, ["Cliente"]);
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "checkout") {
    let checkoutError: string | null = null;
    let created = false;
    try {
      await mutateUser(user.id, (current, users) => {
        if ((current.customerStatus ?? "Activo") !== "Activo") {
          checkoutError = "Tu cuenta está inactiva. Contactá a Ventas para realizar un pedido.";
          return;
        }
        const selectedAddress = getClientAddresses(customerAsClient(current)!).find(address => address.id === formData.get("deliveryAddressId") && address.street.trim() && address.locality.trim());
        if (!selectedAddress) {
          checkoutError = "Seleccioná una dirección guardada. Podés agregar direcciones desde Mi perfil.";
          return;
        }
        const cartItems = current.cart ?? [];
        if (cartItems.length === 0) {
          checkoutError = "Agregá productos al carrito antes de confirmar.";
          return;
        }
        const safeItems = [];
        let subtotal = 0;
        for (const item of cartItems) {
          const product = SAMPLE_PRODUCTS.find((candidate) => candidate.id === item.productId);
          if (!product || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || !Number.isSafeInteger(product.price * item.quantity)) {
            checkoutError = "Hay un producto o cantidad inválidos. Actualizá el carrito e intentá nuevamente.";
            return;
          }
          const itemSubtotal = product.price * item.quantity;
          if (!Number.isSafeInteger(subtotal + itemSubtotal)) {
            checkoutError = "El total del pedido es demasiado grande. Ajustá las cantidades e intentá nuevamente.";
            return;
          }
          subtotal += itemSubtotal;
          safeItems.push({ id: `web-item-${randomUUID()}`, productId: product.id, productName: product.name, quantity: item.quantity, unitPrice: product.price, subtotal: itemSubtotal });
        }
        const today = new Date().toISOString().slice(0, 10);
        const nextDate = new Date(`${today}T12:00:00`);
        nextDate.setDate(nextDate.getDate() + 2);
        const existingOrders = [...SAMPLE_ORDERS, ...users.flatMap((candidate) => candidate.customerOrders ?? [])];
        const existingIds = new Set(existingOrders.map((existingOrder) => existingOrder.id));
        const existingNumbers = new Set(existingOrders.map((existingOrder) => existingOrder.number));
        let sequence = 1;
        let number = `PC-WEB-${String(sequence).padStart(6, "0")}`;
        let id = `web-order-${String(sequence).padStart(6, "0")}`;
        while (existingNumbers.has(number) || existingIds.has(id)) {
          sequence += 1;
          if (!Number.isSafeInteger(sequence)) throw new Error("Order number sequence exhausted");
          number = `PC-WEB-${String(sequence).padStart(6, "0")}`;
          id = `web-order-${String(sequence).padStart(6, "0")}`;
        }
        const order = { id, number, kind: "Regular" as const, fulfillment: "Envío" as const, clientId: `customer-${current.id}`, date: today, deliveryDate: nextDate.toISOString().slice(0, 10), deliveryAddressType: "client" as const, deliveryAddressId: selectedAddress.id, deliveryAddress: formatClientAddress(selectedAddress), items: safeItems, subtotal, discount: 0, total: subtotal, status: "Pendiente" as const, observations: String(formData.get("observations") ?? "").trim().slice(0, 500) };
        current.customerOrders = [...(current.customerOrders ?? []), order];
        current.cart = [];
        created = true;
      });
      return created ? { success: true, intent } : { error: checkoutError ?? "No pudimos confirmar el pedido." };
    } catch {
      return { error: "No pudimos confirmar el pedido. El carrito sigue guardado; intentá nuevamente." };
    }
  }
  const productId = formData.get("productId");

  if (typeof intent !== "string" || typeof productId !== "string" || productId.length > 80) {
    return { error: "La solicitud no contiene un producto válido." };
  }

  if (intent === "remove-item") {
    let removed = false;
    try {
      await mutateUser(user.id, (current) => {
        const cart = current.cart ?? [];
        if (!cart.some((item) => item.productId === productId)) return;
        current.cart = cart.filter((item) => item.productId !== productId);
        removed = true;
      });
      if (!removed) return { error: "Ese producto ya no está en el carrito." };
      return { success: true, intent };
    } catch {
      return { error: "No pudimos quitar el producto. Intentá nuevamente." };
    }
  }

  if (intent !== "update-quantity" || !SAMPLE_PRODUCTS.some((product) => product.id === productId)) {
    return { error: "La acción solicitada no está disponible para ese producto." };
  }

  const rawQuantity = formData.get("quantity");
  const quantity = typeof rawQuantity === "string" ? Number(rawQuantity) : Number.NaN;
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    return { error: "La cantidad indicada no es válida." };
  }

  try {
    const product = SAMPLE_PRODUCTS.find((candidate) => candidate.id === productId)!;
    if (!Number.isSafeInteger(product.price * quantity)) {
      return { error: "La cantidad indicada es demasiado grande." };
    }
    let found = false;
    await mutateUser(user.id, (current) => {
      const cart = (current.cart ?? []).map((item) => ({ ...item }));
      const existing = cart.find((item) => item.productId === productId);
      if (!existing) return;
      found = true;
      if (quantity === 0) current.cart = cart.filter((item) => item.productId !== productId);
      else {
        existing.quantity = quantity;
        current.cart = cart;
      }
    });
    if (!found) return { error: "Ese producto ya no está en el carrito." };
    if (quantity === 0) return { success: true, intent: "remove-item" };
    return { success: true, intent };
  } catch {
    return { error: "No pudimos guardar la cantidad. Intentá nuevamente." };
  }
};

function CartLine({ item }: { item: ReturnType<typeof useLoaderData<typeof loader>>["cart"][number] }) {
  const fetcher = useFetcher<CustomerMutationResult>();

  return (
    <li className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <img src="/hero-pastas.jpg" alt="" className="h-16 w-20 shrink-0 rounded-xl object-cover" />
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-900">{item.product?.name ?? "Producto fuera del catálogo"}</h2>
          {item.product ? (
            <p className="mt-1 text-sm text-gray-600">{currency.format(item.product.price)} por unidad · {item.product.stock}</p>
          ) : (
            <p className="mt-1 text-sm text-amber-900">El precio ya no está disponible en el catálogo. Quitalo para limpiar el carrito.</p>
          )}
          {fetcher.state === "idle" && fetcher.data?.error && <p role="alert" className="mt-1 text-xs text-red-700">{fetcher.data.error}</p>}
          {fetcher.state === "idle" && fetcher.data?.success && <p role="status" className="mt-1 text-xs text-emerald-800">Carrito actualizado.</p>}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div className="inline-flex items-center rounded-xl border border-[#e5d9cb] bg-[#fffdfa]">
          <fetcher.Form method="post">
            <input type="hidden" name="productId" value={item.productId} />
            <input type="hidden" name="quantity" value={item.quantity - 1} />
            <button type="submit" name="intent" value="update-quantity" aria-label={`Restar una unidad de ${item.product?.name ?? "este producto"}`} disabled={fetcher.state !== "idle"} className="h-10 w-10 rounded-l-xl text-lg text-gray-700 hover:bg-amber-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-amber-800">−</button>
          </fetcher.Form>
          <span className="min-w-10 border-x border-[#e5d9cb] px-2 py-2 text-center text-sm font-semibold tabular-nums" aria-label={`Cantidad: ${item.quantity}`}>{item.quantity}</span>
          <fetcher.Form method="post">
            <input type="hidden" name="productId" value={item.productId} />
            <input type="hidden" name="quantity" value={item.quantity + 1} />
            <button type="submit" name="intent" value="update-quantity" aria-label={`Sumar una unidad de ${item.product?.name ?? "este producto"}`} disabled={!item.product || fetcher.state !== "idle"} className="h-10 w-10 rounded-r-xl text-lg text-gray-700 hover:bg-amber-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-amber-800">+</button>
          </fetcher.Form>
        </div>
        <p className="w-28 text-right text-sm font-bold tabular-nums text-gray-900">{item.subtotal === null ? "Sin precio" : currency.format(item.subtotal)}</p>
        <fetcher.Form method="post">
          <input type="hidden" name="productId" value={item.productId} />
          <button type="submit" name="intent" value="remove-item" aria-label={`Quitar ${item.product?.name ?? "producto"} del carrito`} disabled={fetcher.state !== "idle"} className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-800">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 13h11l1-13M9 7V4h6v3" /></svg>
          </button>
        </fetcher.Form>
      </div>
    </li>
  );
}

export default function ClienteCarrito() {
  const { cart, total, totalItems, isActive, hasDeliveryAddress, addresses } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<CustomerMutationResult>();

  return (
    <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">Tu compra</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Mi carrito</h1>
            <p className="mt-2 text-sm text-gray-600">Revisá los productos y ajustá las cantidades.</p>
          </div>
          <span className="rounded-full border border-[#eadfd3] bg-white px-3 py-1.5 text-sm text-gray-700">{totalItems} {totalItems === 1 ? "unidad" : "unidades"}</span>
        </div>
      </div>

      {cart.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[#dfd0c0] bg-white px-6 py-14 text-center" aria-labelledby="cart-empty-title">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-900" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.5a2 2 0 0 0 1.9-1.4L20 8H6" /><circle cx="9.5" cy="19" r="1.2" /><circle cx="17" cy="19" r="1.2" /></svg></span>
          <h2 id="cart-empty-title" className="mt-4 text-lg font-semibold text-gray-900">Tu carrito está vacío</h2>
          <p className="mt-2 text-sm text-gray-600">Explorá el catálogo y agregá los productos que quieras consultar.</p>
          <Link to="/compras/catalogo" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-amber-800 px-4 text-sm font-semibold text-white transition hover:bg-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800">Ver catálogo</Link>
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-[#eadfd3] bg-white shadow-sm" aria-label="Productos en el carrito">
          <ul className="divide-y divide-[#f0e7dd]">{cart.map((item) => <CartLine key={item.productId} item={item} />)}</ul>
          <div className="flex flex-col gap-2 border-t border-[#eadfd3] bg-[#fffdfa] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span className="text-sm text-gray-600">Total de referencia</span>
            <strong className="text-xl tabular-nums text-gray-900">{total === null ? "No disponible" : currency.format(total)}</strong>
          </div>
          <p className="px-5 pb-5 text-xs leading-5 text-gray-500 sm:px-6">Importes calculados con los precios de muestra actuales del catálogo.</p>
        </section>
      )}

      {cart.length > 0 && <fetcher.Form method="post" className="mt-5 rounded-2xl border border-[#eadfd3] bg-white p-5 sm:p-6">
        <label className="mb-4 block text-sm font-semibold text-gray-800">Dirección de entrega<select name="deliveryAddressId" required defaultValue={addresses[0]?.id ?? ""} className="mt-2 h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm">{!addresses.length && <option value="">Agregá una dirección en Mi perfil</option>}{addresses.map((address, index) => <option key={address.id} value={address.id}>{address.label}{index === 0 ? " (principal)" : ""} · {formatClientAddress(address)}</option>)}</select></label>
        <h2 className="text-lg font-semibold text-gray-900">Datos para el pedido</h2>
        <p className="mt-1 text-sm text-gray-600">Se usarán los datos guardados en <Link to="/compras/perfil" className="font-medium text-amber-800 underline">Mi perfil</Link>, iguales a los que consulta Ventas.</p>
        {!isActive && <p role="alert" className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">Tu cuenta está inactiva. Contactá a Ventas para realizar un pedido.</p>}
        {isActive && !hasDeliveryAddress && <p role="alert" className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">Completá el domicilio y la localidad en Mi perfil para continuar.</p>}
        <label htmlFor="order-observations" className="mt-4 block text-sm font-medium text-gray-700">Observaciones de entrega</label>
        <textarea id="order-observations" name="observations" rows={2} maxLength={500} className="mt-1 w-full rounded-xl border border-[#e5d9cb] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-amber-700" placeholder="Indicaciones para recibir el pedido" />
        {fetcher.state === "idle" && fetcher.data?.error && <p role="alert" className="mt-3 text-sm text-red-700">{fetcher.data.error} {fetcher.data.error.includes("Mi perfil") && <Link to="/compras/perfil" className="font-semibold underline">Completar perfil</Link>}</p>}
        <div className="mt-4 flex flex-col gap-3 border-t border-[#f0e7dd] pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-gray-500">Al confirmar, el pedido queda registrado como pendiente para que Ventas lo gestione.</p><button name="intent" value="checkout" type="submit" disabled={fetcher.state !== "idle" || total === null || !isActive || !hasDeliveryAddress} className="min-h-11 shrink-0 rounded-xl bg-amber-800 px-5 text-sm font-semibold text-white hover:bg-amber-900 disabled:opacity-50">{fetcher.state !== "idle" ? "Confirmando…" : "Confirmar pedido"}</button></div>
      </fetcher.Form>}
      {fetcher.state === "idle" && fetcher.data?.success && fetcher.data.intent === "checkout" && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Pedido confirmado. Ya podés consultarlo en Mis pedidos.</p>}

      <aside className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5" aria-labelledby="order-flow-title">
        <h2 id="order-flow-title" className="text-sm font-semibold text-amber-950">Precios y disponibilidad</h2>
        <p className="mt-1 text-sm leading-6 text-amber-900">Los importes y estados corresponden al catálogo de muestra. Ventas revisará el pedido y coordinará la entrega.</p>
      </aside>
    </div>
  );
}
