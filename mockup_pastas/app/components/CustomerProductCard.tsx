import { useFetcher } from "react-router";

import type { CustomerMutationResult } from "~/data/customer.server";
import type { Product } from "~/data/sales";

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export default function CustomerProductCard({
  product,
  isFavorite,
  cartQuantity,
  action,
  allowFavorites = true,
  cartDisabled = false,
}: {
  product: Product;
  isFavorite: boolean;
  cartQuantity: number;
  action: string;
  allowFavorites?: boolean;
  cartDisabled?: boolean;
}) {
  const favoriteFetcher = useFetcher<CustomerMutationResult>();
  const cartFetcher = useFetcher<CustomerMutationResult>();
  const stockAvailable = product.stock === "Disponible";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#eadfd3] bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f1e8dc]">
        <img src="/hero-pastas.jpg" alt="Pastas variadas" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        <span className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm ${stockAvailable ? "border-emerald-200 bg-emerald-50/95 text-emerald-800" : "border-amber-200 bg-amber-50/95 text-amber-900"}`}>
          {product.stock}
        </span>
        {allowFavorites && <favoriteFetcher.Form method="post" action={action} className="absolute right-3 top-3">
          <input type="hidden" name="productId" value={product.id} />
          <button
            type="submit"
            name="intent"
            value="toggle-favorite"
            aria-label={isFavorite ? `Quitar ${product.name} de favoritos` : `Agregar ${product.name} a favoritos`}
            aria-pressed={isFavorite}
            disabled={favoriteFetcher.state !== "idle"}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/95 text-rose-700 shadow-sm transition hover:bg-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800"
          >
            <svg viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M20.8 8.7c0 5.2-8.8 10.1-8.8 10.1S3.2 13.9 3.2 8.7a4.5 4.5 0 0 1 8-2.8 4.5 4.5 0 0 1 8 2.8Z" /></svg>
          </button>
        </favoriteFetcher.Form>}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="min-h-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800">{product.category}</p>
          <h2 className="mt-1.5 text-base font-semibold leading-6 text-gray-900">{product.name}</h2>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#f0e7dd] pt-4">
          <span className="text-xs text-gray-500">Precio por envase</span>
          <span className="text-lg font-bold tracking-tight text-gray-900">{currency.format(product.price)}</span>
        </div>
        <cartFetcher.Form method="post" action={action} className="mt-4">
          <input type="hidden" name="productId" value={product.id} />
          <button
            type="submit"
            name="intent"
            value="add-to-cart"
            disabled={cartDisabled || cartFetcher.state !== "idle"}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-900 disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.5a2 2 0 0 0 1.9-1.4L20 8H6" /><circle cx="9.5" cy="19" r="1.2" /><circle cx="17" cy="19" r="1.2" /><path d="M12 8v5m-2.5-2.5h5" /></svg>
            {cartFetcher.state !== "idle" ? "Guardando…" : cartQuantity > 0 ? `Agregar otro · ${cartQuantity} en carrito` : "Agregar al carrito"}
          </button>
        </cartFetcher.Form>
        {favoriteFetcher.state === "idle" && favoriteFetcher.data?.error && <p role="alert" className="mt-2 text-xs text-red-700">{favoriteFetcher.data.error}</p>}
        {favoriteFetcher.state === "idle" && favoriteFetcher.data?.success && favoriteFetcher.data.intent === "toggle-favorite" && <p role="status" className="mt-2 text-center text-xs text-emerald-800">Favoritos actualizados.</p>}
        {cartFetcher.state === "idle" && cartFetcher.data?.error && <p role="alert" className="mt-2 text-xs text-red-700">{cartFetcher.data.error}</p>}
        {cartFetcher.state === "idle" && cartFetcher.data?.success && <p role="status" className="mt-2 text-center text-xs text-emerald-800">Agregado al carrito.</p>}
      </div>
    </article>
  );
}
