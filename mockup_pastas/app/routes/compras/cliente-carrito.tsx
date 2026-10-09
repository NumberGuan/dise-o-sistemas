import { useLoaderData, Form, useActionData } from "react-router";
import { requireUserAndRole } from "~/utils/session.server";
import { updateUser } from "~/utils/db.server";
import { SAMPLE_PRODUCTS } from "~/data/sales";
import type { Route } from "./+types/cliente-carrito";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await requireUserAndRole(request, ["Cliente"]);
  const cartItems = user.cart || [];
  
  const populatedCart = cartItems.map(item => {
    const product = SAMPLE_PRODUCTS.find(p => p.id === item.productId);
    return {
      ...item,
      product,
      subtotal: product ? product.price * item.quantity : 0
    };
  }).filter(item => item.product != null);
  
  const total = populatedCart.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    cart: populatedCart,
    total
  };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const user = await requireUserAndRole(request, ["Cliente"]);
  const formData = await request.formData();
  const intent = formData.get("intent");
  
  if (intent === "update-quantity") {
    const productId = formData.get("productId") as string;
    const quantity = parseInt(formData.get("quantity") as string, 10);
    
    let cart = user.cart || [];
    if (quantity <= 0) {
      cart = cart.filter(c => c.productId !== productId);
    } else {
      const existing = cart.find(c => c.productId === productId);
      if (existing) {
        existing.quantity = quantity;
      }
    }
    await updateUser(user.id, { cart });
    return { success: true };
  } else if (intent === "remove-item") {
    const productId = formData.get("productId") as string;
    const cart = (user.cart || []).filter(c => c.productId !== productId);
    await updateUser(user.id, { cart });
    return { success: true };
  } else if (intent === "checkout") {
    // There is no persistent store for sales orders yet, nor a payment gateway.
    return { 
      error: "No es posible confirmar la compra en este momento. Falta implementar la integración con el servicio de pasarela de pagos y el sistema de facturación en línea." 
    };
  }
  
  return null;
};

export default function ClienteCarrito() {
  const { cart, total } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mi Carrito</h1>
        <p className="mt-1 text-sm text-gray-500">
          Revisa tus productos y finaliza tu compra.
        </p>
      </div>

      {actionData?.error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Acción no completada</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{actionData.error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {cart.length === 0 ? (
        <div className="text-center rounded-lg border-2 border-dashed border-gray-300 p-12 bg-white">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Tu carrito está vacío</h3>
          <p className="mt-1 text-sm text-gray-500">Ve al catálogo para encontrar productos.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
          <ul role="list" className="divide-y divide-gray-100">
            {cart.map((item) => (
              <li key={item.productId} className="flex flex-col sm:flex-row items-start sm:items-center p-6 justify-between gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div>
                    <h3 className="text-base font-semibold leading-6 text-gray-900">{item.product!.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">Precio unitario: {(item.product!.price).toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                  <Form method="post" className="flex items-center border rounded-md">
                    <input type="hidden" name="productId" value={item.productId} />
                    <input type="hidden" name="intent" value="update-quantity" />
                    <input type="hidden" name="quantity" value={item.quantity - 1} />
                    <button type="submit" disabled={item.quantity <= 1} className="px-3 py-1 text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                      -
                    </button>
                    <span className="px-3 py-1 font-medium text-sm text-gray-900 border-x">{item.quantity}</span>
                  </Form>
                  <Form method="post" className="flex items-center border rounded-md -ml-4 sm:-ml-2">
                    <input type="hidden" name="productId" value={item.productId} />
                    <input type="hidden" name="intent" value="update-quantity" />
                    <input type="hidden" name="quantity" value={item.quantity + 1} />
                    <button type="submit" className="px-3 py-1 text-gray-500 hover:bg-gray-50">
                      +
                    </button>
                  </Form>

                  <div className="text-right w-24">
                    <p className="text-base font-semibold text-gray-900">{(item.subtotal).toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</p>
                  </div>

                  <Form method="post">
                    <input type="hidden" name="productId" value={item.productId} />
                    <button type="submit" name="intent" value="remove-item" className="text-red-500 hover:text-red-700 p-1 rounded transition-colors bg-red-50 hover:bg-red-100" title="Eliminar del carrito">
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </Form>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-6 sm:rounded-b-xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-lg font-medium text-gray-900">
              Total: <span className="font-bold text-xl ml-2">{(total).toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</span>
            </div>
            <Form method="post">
              <button
                type="submit"
                name="intent"
                value="checkout"
                className="rounded-md bg-amber-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 transition"
              >
                Confirmar pedido
              </button>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
