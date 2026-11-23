import { SAMPLE_PRODUCTS } from "~/data/sales";

export type CartItem = { productId: string; quantity: number };
export const MAX_GUEST_QUANTITY = 1000;

export function guestCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const quantities = new Map<string, number>();
  for (const item of value) {
    if (!item || typeof item.productId !== "string" || !SAMPLE_PRODUCTS.some(product => product.id === item.productId) || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_GUEST_QUANTITY) continue;
    quantities.set(item.productId, Math.min(MAX_GUEST_QUANTITY, (quantities.get(item.productId) ?? 0) + item.quantity));
  }
  return [...quantities].map(([productId, quantity]) => ({ productId, quantity }));
}

export function mergeGuestCart(existing: CartItem[], guest: CartItem[]): CartItem[] {
  const cart = existing.map(item => ({ ...item }));
  for (const item of guest) {
    const current = cart.find(entry => entry.productId === item.productId);
    const quantity = (current?.quantity ?? 0) + item.quantity;
    const product = SAMPLE_PRODUCTS.find(product => product.id === item.productId);
    if (!product || !Number.isSafeInteger(quantity) || !Number.isSafeInteger(quantity * product.price)) throw new Error("La cantidad del carrito es demasiado grande.");
    if (current) current.quantity = quantity;
    else cart.push({ ...item });
  }
  return cart;
}
