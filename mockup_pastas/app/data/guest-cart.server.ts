import { data, redirect } from "react-router";
import { sessionStorage } from "~/utils/session.server";
import { SAMPLE_PRODUCTS } from "~/data/sales";
import { guestCartItems, MAX_GUEST_QUANTITY } from "~/data/guest-cart";

export async function getGuestCart(request: Request) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  return guestCartItems(session.get("guestCart"));
}

export async function updateGuestCart(request: Request) {
  const form = await request.formData();
  const intent = form.get("intent");
  if (intent === "checkout") return redirect("/register?redirectTo=%2Fcompras%2Fcarrito");
  if (!["add-to-cart", "update-quantity", "remove-item"].includes(String(intent))) return data({ error: "Para guardar favoritos o comprar, ingresá o creá una cuenta." }, { status: 400 });
  const productId = form.get("productId");
  if (typeof productId !== "string" || !SAMPLE_PRODUCTS.some(product => product.id === productId)) return data({ error: "Seleccioná un producto del catálogo." }, { status: 400 });
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const cart = guestCartItems(session.get("guestCart"));
  const current = cart.find(item => item.productId === productId);
  const rawQuantity = form.get("quantity");
  const quantity = intent === "remove-item" ? 0 : intent === "add-to-cart" ? (current?.quantity ?? 0) + 1 : typeof rawQuantity === "string" && rawQuantity.trim() ? Number(rawQuantity) : NaN;
  if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > MAX_GUEST_QUANTITY) return data({ error: `La cantidad debe estar entre 0 y ${MAX_GUEST_QUANTITY}.` }, { status: 400 });
  const next = cart.filter(item => item.productId !== productId);
  if (quantity > 0) next.push({ productId, quantity });
  session.set("guestCart", next);
  return data({ success: true, intent: String(intent) }, { headers: { "Set-Cookie": await sessionStorage.commitSession(session) } });
}
