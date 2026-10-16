import { useFetcher } from "react-router";
import type { CustomerMutationResult } from "~/data/customer.server";
import type { Product } from "~/data/sales";
import type { CartItem } from "~/data/guest-cart";

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export default function CustomerCartLine({ item, disabled = false }: { item: CartItem & { product: Product | null; subtotal: number | null }; disabled?: boolean }) {
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
            <button type="submit" name="intent" value="update-quantity" aria-label={`Restar una unidad de ${item.product?.name ?? "este producto"}`} disabled={disabled || fetcher.state !== "idle"} className="h-10 w-10 rounded-l-xl text-lg text-gray-700 hover:bg-amber-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-amber-800">−</button>
          </fetcher.Form>
          <span className="min-w-10 border-x border-[#e5d9cb] px-2 py-2 text-center text-sm font-semibold tabular-nums" aria-label={`Cantidad: ${item.quantity}`}>{item.quantity}</span>
          <fetcher.Form method="post">
            <input type="hidden" name="productId" value={item.productId} />
            <input type="hidden" name="quantity" value={item.quantity + 1} />
            <button type="submit" name="intent" value="update-quantity" aria-label={`Sumar una unidad de ${item.product?.name ?? "este producto"}`} disabled={disabled || !item.product || fetcher.state !== "idle"} className="h-10 w-10 rounded-r-xl text-lg text-gray-700 hover:bg-amber-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-amber-800">+</button>
          </fetcher.Form>
        </div>
        <p className="w-28 text-right text-sm font-bold tabular-nums text-gray-900">{item.subtotal === null ? "Sin precio" : currency.format(item.subtotal)}</p>
        <fetcher.Form method="post">
          <input type="hidden" name="productId" value={item.productId} />
          <button type="submit" name="intent" value="remove-item" aria-label={`Quitar ${item.product?.name ?? "producto"} del carrito`} disabled={disabled || fetcher.state !== "idle"} className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-800">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 13h11l1-13M9 7V4h6v3" /></svg>
          </button>
        </fetcher.Form>
      </div>
    </li>
  );
}

