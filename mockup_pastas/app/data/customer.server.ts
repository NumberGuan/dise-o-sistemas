import { SAMPLE_PRODUCTS, splitClientAddress } from "~/data/sales";
import type { Client } from "~/data/sales";
import { mutateUser, type User } from "~/utils/db.server";

export function customerAsClient(user: User): Client | null {
  if (user.role !== "Cliente") return null;
  const customerData = user.customerData ?? {
    type: "Particular" as const,
    documentType: "DNI" as const,
    cuitCuil: "",
    ivaType: "" as const,
    floor: "",
    apartment: "",
    locality: "",
    province: "Buenos Aires",
    notes: "",
  };
  return {
    id: `customer-${user.id}`,
    code: `CLI-${user.id.slice(0, 8).toUpperCase()}`,
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    status: user.customerStatus ?? "Activo",
    ...customerData,
    street: user.customerData?.street ?? splitClientAddress(user.address ?? "").street,
    streetNumber: user.customerData?.streetNumber ?? splitClientAddress(user.address ?? "").streetNumber,
    balance: customerData.type === "Comercio" ? user.customerData?.balance ?? 0 : 0,
  };
}

export type CustomerMutationResult = {
  success?: boolean;
  error?: string;
  intent?: string;
};

export async function updateCustomerProductData(user: User, formData: FormData): Promise<CustomerMutationResult> {
  const intent = formData.get("intent");
  const productId = formData.get("productId");

  if (typeof intent !== "string" || typeof productId !== "string" || productId.length > 80) {
    return { error: "La solicitud no contiene un producto válido." };
  }
  if (!SAMPLE_PRODUCTS.some((product) => product.id === productId)) {
    return { error: "Ese producto no está en el catálogo actual." };
  }

  try {
    if (intent === "toggle-favorite" || intent === "remove-favorite") {
      await mutateUser(user.id, (current) => {
        const favorites = new Set(current.favorites ?? []);
        if (intent === "remove-favorite" || favorites.has(productId)) favorites.delete(productId);
        else favorites.add(productId);
        current.favorites = [...favorites];
      });
      return { success: true, intent };
    }

    if (intent === "add-to-cart") {
      const product = SAMPLE_PRODUCTS.find((item) => item.id === productId)!;
      let invalidQuantity = false;
      await mutateUser(user.id, (current) => {
        const cart = (current.cart ?? []).map((item) => ({ ...item }));
        const existing = cart.find((item) => item.productId === productId);
        const nextQuantity = (existing?.quantity ?? 0) + 1;
        if (!Number.isSafeInteger(nextQuantity) || !Number.isSafeInteger(product.price * nextQuantity)) {
          invalidQuantity = true;
          return;
        }
        if (existing) existing.quantity = nextQuantity;
        else cart.push({ productId, quantity: nextQuantity });
        current.cart = cart;
      });
      if (invalidQuantity) return { error: "No se puede agregar una cantidad mayor para este producto." };
      return { success: true, intent };
    }

    return { error: "La acción solicitada no está disponible." };
  } catch {
    return { error: "No pudimos guardar el cambio. Intentá nuevamente." };
  }
}
