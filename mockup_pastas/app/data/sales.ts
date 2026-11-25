import { validateTabulatedAddress, type AddressCatalog } from "./domicilios";
export type ClientStatus = "Activo" | "Inactivo";

// Opciones de referencia para la maqueta; no representan un catálogo fiscal oficial.
export const CLIENT_DOCUMENT_TYPES = ["DNI", "CUIT", "CUIL", "Pasaporte", "Otro"] as const;
export type ClientDocumentType = string;

// Opciones de muestra para la interfaz, sujetas a definición del negocio.
export const CLIENT_IVA_TYPES = ["Responsable inscripto", "Monotributista", "Consumidor final", "Exento"] as const;
export type ClientIvaType = string;

export type ClientAddress = {
  id: string;
  label: string;
  street: string;
  streetNumber: string;
  floor: string;
  apartment: string;
  locality: string;
  province: string;
};

export const MAX_CLIENT_ADDRESSES = 20;
export const CLIENT_ADDRESS_LABEL_MAX_LENGTH = 60;

export function createFixedClientAddress(): ClientAddress {
  return { id: "principal", label: "Dirección fija", street: "", streetNumber: "", floor: "", apartment: "", locality: "", province: "Buenos Aires" };
}

export function getClientAddresses(client: Pick<Client, "id" | "street" | "streetNumber" | "floor" | "apartment" | "locality" | "province" | "addresses">): ClientAddress[] {
  if (client.addresses) return client.addresses;
  if (!client.street.trim()) return [];
  return [{ id: "principal", label: "Principal", street: client.street, streetNumber: client.streetNumber, floor: client.floor ?? "", apartment: client.apartment ?? "", locality: client.locality, province: client.province }];
}

export function validateClientAddresses(value: unknown, previous: ClientAddress[] = [], catalog?: AddressCatalog): ClientAddress[] {
  if (!Array.isArray(value) || value.length > MAX_CLIENT_ADDRESSES) throw new Error(`Podés guardar hasta ${MAX_CLIENT_ADDRESSES} direcciones.`);
  if (!value.length) throw new Error("Ingresá la dirección fija de facturación del cliente.");
  const ids = new Set<string>();
  return value.map((entry) => {
    if (!entry || typeof entry !== "object") throw new Error("La dirección no es válida.");
    const fields = { id: 120, label: CLIENT_ADDRESS_LABEL_MAX_LENGTH, street: 160, streetNumber: 20, floor: 20, apartment: 20, locality: 100, province: 100 };
    const address = {} as ClientAddress;
    for (const key of Object.keys(fields) as (keyof ClientAddress)[]) {
      const text = entry[key];
      if (typeof text !== "string" || text.length > fields[key] || (!["floor", "apartment"].includes(key) && !text.trim())) throw new Error("Completá el nombre, calle, altura, localidad y provincia de cada dirección.");
      address[key] = text.trim();
    }
    validateTabulatedAddress(address, previous.find(item => item.id === address.id), catalog);
    if (ids.has(address.id)) throw new Error("Hay direcciones repetidas.");
    ids.add(address.id);
    return address;
  });
}

export type Client = {
  id: string;
  code: string;
  type: string;
  name: string;
  documentType: ClientDocumentType;
  cuitCuil: string;
  ivaType: ClientIvaType | "";
  phone: string;
  additionalPhones?: string[];
  email: string;
  street: string;
  streetNumber: string;
  balance: number;
  // La primera dirección es la fija de facturación; las restantes son complementarias.
  addresses?: ClientAddress[];
  floor?: string;
  apartment?: string;
  locality: string;
  province: string;
  status: ClientStatus;
  notes: string;
};

export const COUNTER_CLIENT: Client = {
  id: "consumidor-final", code: "MOSTRADOR", type: "Particular", name: "Consumidor final (Mostrador)",
  documentType: "Otro", cuitCuil: "", ivaType: "Consumidor final", phone: "", email: "",
  street: "", streetNumber: "", locality: "", province: "", balance: 0, addresses: [], status: "Activo", notes: "",
};

// Compatibilidad con las direcciones guardadas antes de separar calle y altura.
export function splitClientAddress(address: string) {
  const match = address.trim().match(/^(.*?)\s+(\d+[A-Za-z]?)$/);
  return { street: match?.[1] ?? address.trim(), streetNumber: match?.[2] ?? "" };
}

export function normalizeClient(client: Client & { address?: string }): Client {
  const { address, ...fields } = client;
  const legacy = splitClientAddress(address ?? "");
  return { ...fields, street: client.street ?? legacy.street, streetNumber: client.streetNumber ?? legacy.streetNumber, balance: client.type === "Comercio" ? client.balance ?? 0 : 0 };
}

export function formatClientAddress(client: Pick<Client, "street" | "streetNumber" | "floor" | "apartment" | "locality" | "province">) {
  return [
    [client.street, client.streetNumber].filter(Boolean).join(" "),
    client.floor && `Piso ${client.floor}`,
    client.apartment && `Depto. ${client.apartment}`,
    client.locality,
    client.province,
  ].filter(Boolean).join(", ");
}

export type ClientActivity = { type: string; code: string; date: string; summary: string; status: string; to: string };

export type Product = {
  id: string;
  name: string;
  category: "Pastas" | "Salsas";
  price: number;
  stock: string;
};

export const SAMPLE_PRODUCTS: Product[] = [
  { id: "p-1", name: "Tallarines x 500g", category: "Pastas", price: 2000, stock: "Disponible" },
  { id: "p-2", name: "Ravioles de verdura x 500g", category: "Pastas", price: 3500, stock: "A producir" },
  { id: "p-3", name: "Spaghetti x 500g", category: "Pastas", price: 2200, stock: "Disponible" },
  { id: "p-4", name: "Ñoquis de papa x 500g", category: "Pastas", price: 2800, stock: "Disponible" },
  { id: "p-5", name: "Sorrentinos de jamón y queso x 500g", category: "Pastas", price: 4200, stock: "A producir" },
  { id: "p-6", name: "Fettuccine x 500g", category: "Pastas", price: 2100, stock: "Disponible" },
  { id: "p-7", name: "Ravioles de jamón y queso x 500g", category: "Pastas", price: 3800, stock: "Disponible" },
  { id: "p-8", name: "Ravioles de ricota y nuez x 500g", category: "Pastas", price: 4000, stock: "Disponible" },
  { id: "p-9", name: "Sorrentinos de calabaza y queso x 500g", category: "Pastas", price: 4100, stock: "Disponible" },
  { id: "p-10", name: "Canelones de verdura y ricota x 500g", category: "Pastas", price: 4500, stock: "Disponible" },
  { id: "p-11", name: "Lasagna de carne x 500g", category: "Pastas", price: 4800, stock: "Disponible" },
  { id: "p-12", name: "Agnolottis de pollo x 500g", category: "Pastas", price: 4300, stock: "Disponible" },
  { id: "p-13", name: "Capelettis de carne x 500g", category: "Pastas", price: 4400, stock: "Disponible" },
  { id: "s-1", name: "Salsa fileto x 250g", category: "Salsas", price: 1800, stock: "Disponible" },
  { id: "s-2", name: "Salsa bolognesa x 250g", category: "Salsas", price: 2500, stock: "Disponible" },
  { id: "s-3", name: "Salsa blanca x 250g", category: "Salsas", price: 2000, stock: "Disponible" },
  { id: "s-4", name: "Salsa cuatro quesos x 250g", category: "Salsas", price: 2800, stock: "Disponible" },
  { id: "s-5", name: "Salsa rosa x 250g", category: "Salsas", price: 2200, stock: "Disponible" },
  { id: "s-6", name: "Salsa pesto x 250g", category: "Salsas", price: 2600, stock: "Disponible" },
  { id: "s-7", name: "Salsa de champiñones x 250g", category: "Salsas", price: 2900, stock: "Disponible" },
];

export const ORDER_STATUSES = ["Pendiente", "En preparación", "Listo para remito", "Facturado", "Cancelado"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const ORDER_KINDS = ["Regular", "Mostrador", "Evento"] as const;
export type OrderKind = (typeof ORDER_KINDS)[number];

export type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type Order = {
  id: string;
  number: string;
  clientId: string;
  kind?: OrderKind;
  fulfillment?: string;
  deliveryTime?: string;
  employeeId?: string;
  date: string;
  deliveryDate: string;
  deliveryAddressType?: "client" | "custom";
  deliveryAddressId?: string;
  deliveryAddress?: string;
  customDeliveryAddress?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: OrderStatus;
  observations: string;
};

export const INVOICE_STATUSES = ["Borrador", "Emitido", "Anulado"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_TYPES = ["Factura A", "Factura B", "Factura C", "Nota de Crédito"] as const;
export type InvoiceType = (typeof INVOICE_TYPES)[number];

export type InvoiceItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount?: number;
  netSubtotal?: number;
};

export type Invoice = {
  id: string;
  number: string;
  type: InvoiceType;
  date: string;
  dueDate: string;
  clientId: string;
  orderId?: string;
  billingAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  commercialDiscountRate?: number;
  observations: string;

};


export const BUDGET_STATUSES = ["Borrador", "Enviado", "Aceptado", "Rechazado", "Vencido", "Convertido"] as const;
export type BudgetStatus = (typeof BUDGET_STATUSES)[number];

export type BudgetItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type Budget = {
  id: string;
  number: string;
  date: string;
  validUntil: string;
  clientId: string;
  items: BudgetItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: BudgetStatus;
  observations: string;
  orderId?: string;
};


export const REMIT_STATUSES = ["Borrador", "Despachado", "Entregado", "Anulado"] as const;
export type RemitStatus = (typeof REMIT_STATUSES)[number];

export type RemitItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
};

export type Remit = {
  id: string;
  number: string;
  date: string;
  clientId: string;
  orderId: string;
  items: RemitItem[];
  status: RemitStatus;
  observations: string;
};

// El modelo del repositorio nombra DevolucionCliente y DetalleDevolucionCliente,
// pero todavía no define sus estados. Este ciclo es provisional para la maqueta.
export const CUSTOMER_RETURN_STATUSES = ["Borrador", "Registrada", "Anulada"] as const;
export type CustomerReturnStatus = (typeof CUSTOMER_RETURN_STATUSES)[number];

export type CustomerReturnItem = {
  id: string;
  productId: string;
  productName: string;
  deliveredQuantity: number;
  previouslyReturnedQuantity: number;
  availableQuantity: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type CustomerReturn = {
  id: string;
  number: string;
  date: string;
  clientId: string;
  remitId: string;
  orderId: string;
  invoiceId?: string;
  items: CustomerReturnItem[];
  reason: string;
  observations: string;
  estimatedRefundTotal: number;
  status: CustomerReturnStatus;
};

export function getRegisteredReturnedQuantity(returns: CustomerReturn[], remitId: string, productId: string, excludingReturnId?: string) {
  return returns
    .filter(customerReturn => customerReturn.status === "Registrada" && customerReturn.remitId === remitId && customerReturn.id !== excludingReturnId)
    .flatMap(customerReturn => customerReturn.items)
    .filter(item => item.productId === productId)
    .reduce((total, item) => total + item.quantity, 0);
}

export function getRemitAvailableQuantity(returns: CustomerReturn[], remit: Remit, productId: string, excludingReturnId?: string) {
  const remitItem = remit.items.find(item => item.productId === productId);
  if (!remitItem) return 0;
  return Math.max(0, remitItem.quantity - getRegisteredReturnedQuantity(returns, remit.id, productId, excludingReturnId));
}

export const PAYMENT_METHODS = ["Efectivo", "Transferencia", "Cheque", "Tarjeta de Crédito", "Tarjeta de Débito"] as const;
export type PaymentMethod = string;

export const RECEIPT_STATUSES = ["Borrador", "Registrado", "Anulado"] as const;
export type ReceiptStatus = (typeof RECEIPT_STATUSES)[number];

export type ReceiptPaymentDetail = {
  id: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
};

export type ReceiptInvoiceDetail = {
  invoiceId: string;
  invoiceNumber: string;
  amountApplied: number;
};

export type Receipt = {
  cashSessionId?: string;
  registeredAt?: string;
  registeredBy?: { id: string; name: string };
  id: string;
  number: string;
  date: string;
  clientId: string;
  invoices: ReceiptInvoiceDetail[];
  payments: ReceiptPaymentDetail[];
  total: number;
  status: ReceiptStatus;
  observations: string;
  accountMonth?: string;
  advanceOrderId?: string;
};

// Solo los recibos registrados afectan el saldo. Un borrador no representa un cobro.
export function getInvoicePaymentSummary(invoice: Invoice, excludingReceiptId: string | undefined, receipts: Receipt[]) {
  const paid = receipts
    .filter(receipt => receipt.status === "Registrado" && receipt.id !== excludingReceiptId && receipt.clientId === invoice.clientId)
    .flatMap(receipt => receipt.invoices)
    .filter(detail => detail.invoiceId === invoice.id)
    .reduce((sum, detail) => sum + detail.amountApplied, 0);
  const balance = Math.max(0, Math.round((invoice.total - paid) * 100) / 100);
  return { paid: Math.round(paid * 100) / 100, balance };
}
