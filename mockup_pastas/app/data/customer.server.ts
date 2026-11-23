import { randomUUID } from "node:crypto";
import { catalogAddressData } from "~/data/catalogs";
import { getCatalogs } from "~/data/catalogs.server";
import {
  CLIENT_ADDRESS_LABEL_MAX_LENGTH, MAX_CLIENT_ADDRESSES, SAMPLE_PRODUCTS, createFixedClientAddress,
  formatClientAddress, getClientAddresses, splitClientAddress, validateClientAddresses, type Client,
} from "~/data/sales";
import { mutateUser, type User } from "~/utils/db.server";

const defaultCustomerData = {
  type: "Particular",
  documentType: "DNI",
  cuitCuil: "",
  ivaType: "",
  floor: "",
  apartment: "",
  locality: "",
  province: "Buenos Aires",
  notes: "",
} satisfies NonNullable<User["customerData"]>;

export function customerAsClient(user: User): Client | null {
  if (user.role !== "Cliente") return null;
  const customerData = user.customerData ?? defaultCustomerData;
  return {
    id: `customer-${user.id}`,
    code: `CLI-${user.id.slice(0, 8).toUpperCase()}`,
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    additionalPhones: user.additionalPhones ?? [],
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

export type CustomerAddressResult = { addressId: string } | { error: string };

export async function saveCustomerDeliveryAddress(userId: string, intent: "add-delivery-address" | "rename-delivery-address", formData: FormData): Promise<CustomerAddressResult> {
  const input = formData.get("addressLabel");
  const label = typeof input === "string" ? input.trim() : "";
  if (!label || label.length > CLIENT_ADDRESS_LABEL_MAX_LENGTH) {
    return { error: `Ingresá un nombre de hasta ${CLIENT_ADDRESS_LABEL_MAX_LENGTH} caracteres para la dirección.` };
  }

  try {
    const catalog = intent === "add-delivery-address" ? catalogAddressData(await getCatalogs()) : undefined;
    let addressId = "";
    await mutateUser(userId, (current) => {
      const client = customerAsClient(current);
      if (!client) throw new Error("La cuenta de cliente ya no está disponible.");
      const addresses = getClientAddresses(client);
      const customerData = current.customerData ?? defaultCustomerData;

      if (intent === "rename-delivery-address") {
        const address = addresses.find(item => item.id === formData.get("addressId"));
        if (!address) throw new Error("Esa dirección ya no está guardada en tu perfil.");
        addressId = address.id;
        current.customerData = { ...customerData, addresses: addresses.map(item => item.id === addressId ? { ...item, label } : item) };
        return;
      }

      if (addresses.length >= MAX_CLIENT_ADDRESSES) throw new Error(`Podés guardar hasta ${MAX_CLIENT_ADDRESSES} direcciones.`);
      addressId = addresses.length ? randomUUID() : createFixedClientAddress().id;
      const [address] = validateClientAddresses([{
        id: addressId, label, street: formData.get("street"), streetNumber: formData.get("streetNumber"),
        floor: formData.get("floor") ?? "", apartment: formData.get("apartment") ?? "",
        locality: formData.get("locality"), province: formData.get("province"),
      }], [], catalog);
      if (addresses.some(item => formatClientAddress(item).localeCompare(formatClientAddress(address), "es-AR", { sensitivity: "base" }) === 0)) {
        throw new Error("Esa dirección ya está guardada en tu perfil. Podés elegirla para el envío.");
      }
      if (!addresses.length) {
        const { street, streetNumber, floor, apartment, locality, province } = address;
        current.address = `${street} ${streetNumber}`;
        current.customerData = { ...customerData, street, streetNumber, floor, apartment, locality, province, addresses: [address] };
      } else {
        current.customerData = { ...customerData, addresses: [...addresses, address] };
      }
    });
    return { addressId };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No pudimos guardar la dirección. Intentá nuevamente." };
  }
}

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
      const rawQuantity = formData.get("quantity");
      const quantityToAdd = rawQuantity === null ? 1 : typeof rawQuantity === "string" && rawQuantity.trim() ? Number(rawQuantity) : Number.NaN;
      if (!Number.isSafeInteger(quantityToAdd) || quantityToAdd < 1 || quantityToAdd > 1000) {
        return { error: "Elegí una cantidad entre 1 y 1000." };
      }
      let invalidQuantity = false;
      await mutateUser(user.id, (current) => {
        const cart = (current.cart ?? []).map((item) => ({ ...item }));
        const existing = cart.find((item) => item.productId === productId);
        const nextQuantity = (existing?.quantity ?? 0) + quantityToAdd;
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
