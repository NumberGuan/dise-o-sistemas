import { useLoaderData, Form } from "react-router";
import { requireUserAndRole } from "~/utils/session.server";
import { updateUser } from "~/utils/db.server";
import { SAMPLE_PRODUCTS } from "~/data/sales";
import type { Route } from "./+types/cliente-catalogo";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await requireUserAndRole(request, ["Cliente"]);
  return {
    products: SAMPLE_PRODUCTS,
    favorites: user.favorites || [],
    cart: user.cart || []
  };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const user = await requireUserAndRole(request, ["Cliente"]);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const productId = formData.get("productId") as string;

  if (intent === "toggle-favorite") {
    let favorites = user.favorites || [];
    if (favorites.includes(productId)) {
      favorites = favorites.filter(id => id !== productId);
    } else {
      favorites = [...favorites, productId];
    }
    await updateUser(user.id, { favorites });
  } else if (intent === "add-to-cart") {
    const cart = user.cart || [];
    const existing = cart.find(item => item.productId === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ productId, quantity: 1 });
    }
    await updateUser(user.id, { cart });
  }
  
  return null;
};

export default function ClienteCatalogo() {
  const { products, favorites, cart } = useLoaderData<typeof loader>();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo de Productos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Explora nuestros productos y agrégalos a tu carrito.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        {products.map((product) => {
          const isFavorite = favorites.includes(product.id);
          const inCart = cart.find(c => c.productId === product.id);

          return (
            <div key={product.id} className="group relative border rounded-lg p-4 bg-white shadow-sm flex flex-col hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                <Form method="post">
                  <input type="hidden" name="productId" value={product.id} />
                  <button
                    type="submit"
                    name="intent"
                    value="toggle-favorite"
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                  >
                    <svg
                      className={`h-6 w-6 ${isFavorite ? "fill-red-500 text-red-500" : "fill-none stroke-current"}`}
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                  </button>
                </Form>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Precio</span>
                  <span className="font-semibold text-gray-900">{(product.price).toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Estado</span>
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    product.stock === "Disponible" 
                      ? "bg-green-50 text-green-700 ring-green-600/20" 
                      : "bg-amber-50 text-amber-700 ring-amber-600/20"
                  }`}>
                    {product.stock}
                  </span>
                </div>

                <Form method="post" className="pt-2">
                  <input type="hidden" name="productId" value={product.id} />
                  <button
                    type="submit"
                    name="intent"
                    value="add-to-cart"
                    className="w-full flex items-center justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 transition"
                  >
                    {inCart ? `Agregar otro (${inCart.quantity} en carrito)` : "Agregar al carrito"}
                  </button>
                </Form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
