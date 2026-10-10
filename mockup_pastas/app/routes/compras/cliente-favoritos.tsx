import { Link, useLoaderData } from "react-router";

import CustomerProductCard from "~/components/CustomerProductCard";
import { updateCustomerProductData } from "~/data/customer.server";
import { SAMPLE_PRODUCTS } from "~/data/sales";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/cliente-favoritos";
export { default as ErrorBoundary } from "~/components/CustomerErrorBoundary";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await requireUserAndRole(request, ["Cliente"]);
  const favorites = user.favorites ?? [];
  return {
    favoriteProducts: SAMPLE_PRODUCTS.filter((product) => favorites.includes(product.id)),
    favorites,
    cart: user.cart ?? [],
  };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const user = await requireUserAndRole(request, ["Cliente"]);
  return updateCustomerProductData(user, await request.formData());
};

export default function ClienteFavoritos() {
  const { favoriteProducts, favorites, cart } = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">Tu selección</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Mis favoritos</h1>
          <p className="mt-2 text-sm text-gray-600">Productos que guardaste desde tu catálogo.</p>
        </div>
        <span className="w-fit rounded-full border border-[#eadfd3] bg-white px-3 py-1.5 text-sm text-gray-700">{favoriteProducts.length} {favoriteProducts.length === 1 ? "producto" : "productos"}</span>
      </div>

      {favoriteProducts.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[#dfd0c0] bg-white px-6 py-14 text-center" aria-labelledby="favorites-empty-title">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-700" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M20.8 8.7c0 5.2-8.8 10.1-8.8 10.1S3.2 13.9 3.2 8.7a4.5 4.5 0 0 1 8-2.8 4.5 4.5 0 0 1 8 2.8Z" /></svg>
          </span>
          <h2 id="favorites-empty-title" className="mt-4 text-lg font-semibold text-gray-900">Todavía no guardaste favoritos</h2>
          <p className="mt-2 text-sm text-gray-600">Usá el corazón en una tarjeta del catálogo para guardar un producto acá.</p>
          <Link to="/compras/catalogo" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-amber-800 px-4 text-sm font-semibold text-white transition hover:bg-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800">Explorar catálogo</Link>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favoriteProducts.map((product) => (
            <CustomerProductCard
              key={product.id}
              product={product}
              isFavorite={favorites.includes(product.id)}
              cartQuantity={cart.find((item) => item.productId === product.id)?.quantity ?? 0}
              action="/compras/favoritos"
            />
          ))}
        </div>
      )}
    </div>
  );
}
