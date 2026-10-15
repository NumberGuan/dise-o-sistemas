import type { NavItem } from "~/data/navigation";

export const SALES_PAGES = [
  { label: "Resumen", to: "/ventas" },
  { label: "Clientes", to: "/ventas/clientes" },
  { label: "Presupuestos", to: "/ventas/presupuestos" },
  { label: "Pedidos", to: "/ventas/pedidos" },
  { label: "Comprobantes", to: "/ventas/comprobantes" },
  { label: "Recibos", to: "/ventas/recibos" },
  { label: "Remitos", to: "/ventas/remitos" },
  { label: "Devoluciones", to: "/ventas/devoluciones" },
] as const satisfies readonly NavItem[];

export type ClientStatus = "Activo" | "Inactivo";

// Opciones de referencia para la maqueta; no representan un catálogo fiscal oficial.
export const CLIENT_DOCUMENT_TYPES = ["DNI", "CUIT", "CUIL", "Pasaporte", "Otro"] as const;
export type ClientDocumentType = (typeof CLIENT_DOCUMENT_TYPES)[number];

// Opciones de muestra para la interfaz, sujetas a definición del negocio.
export const CLIENT_IVA_TYPES = ["Responsable inscripto", "Monotributista", "Consumidor final", "Exento"] as const;
export type ClientIvaType = (typeof CLIENT_IVA_TYPES)[number];

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

export function getClientAddresses(client: Pick<Client, "id" | "street" | "streetNumber" | "floor" | "apartment" | "locality" | "province" | "addresses">): ClientAddress[] {
  if (client.addresses) return client.addresses;
  if (!client.street.trim()) return [];
  return [{ id: "principal", label: "Principal", street: client.street, streetNumber: client.streetNumber, floor: client.floor ?? "", apartment: client.apartment ?? "", locality: client.locality, province: client.province }];
}

export function validateClientAddresses(value: unknown): ClientAddress[] {
  if (!Array.isArray(value) || value.length > 20) throw new Error("Podés guardar hasta 20 direcciones.");
  const ids = new Set<string>();
  return value.map((entry) => {
    if (!entry || typeof entry !== "object") throw new Error("La dirección no es válida.");
    const fields = { id: 120, label: 60, street: 160, streetNumber: 20, floor: 20, apartment: 20, locality: 100, province: 100 };
    const address = {} as ClientAddress;
    for (const key of Object.keys(fields) as (keyof ClientAddress)[]) {
      const text = entry[key];
      if (typeof text !== "string" || text.length > fields[key] || (!["floor", "apartment"].includes(key) && !text.trim())) throw new Error("Completá el nombre, calle, altura, localidad y provincia de cada dirección.");
      address[key] = text.trim();
    }
    if (ids.has(address.id)) throw new Error("Hay direcciones repetidas.");
    ids.add(address.id);
    return address;
  });
}

export type Client = {
  id: string;
  code: string;
  type: "Comercio" | "Distribuidor" | "Particular";
  name: string;
  documentType: ClientDocumentType;
  cuitCuil: string;
  ivaType: ClientIvaType | "";
  phone: string;
  email: string;
  street: string;
  streetNumber: string;
  balance: number;
  addresses?: ClientAddress[];
  floor?: string;
  apartment?: string;
  locality: string;
  province: string;
  status: ClientStatus;
  notes: string;
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

export const SAMPLE_CLIENTS: Client[] = [
  { id: "c-148", code: "CLI-00148", type: "Distribuidor", name: "Distribuidora El Sol", documentType: "CUIT", cuitCuil: "30-71234567-8", ivaType: "Responsable inscripto", phone: "11 4567-2300", email: "compras@distribuidoraelsol.com.ar", street: "Av. Rivadavia", streetNumber: "2840", balance: 0, floor: "", apartment: "", locality: "Morón", province: "Buenos Aires", status: "Activo", notes: "Entrega por la mañana. Contactar a Laura." },
  { id: "c-147", code: "CLI-00147", type: "Comercio", name: "Supermercados Andes", documentType: "CUIT", cuitCuil: "30-69876543-2", ivaType: "Responsable inscripto", phone: "11 4788-1200", email: "pedidos@andes.com.ar", street: "Belgrano", streetNumber: "145", balance: 0, floor: "", apartment: "", locality: "San Martín", province: "Buenos Aires", status: "Activo", notes: "" },
  { id: "c-146", code: "CLI-00146", type: "Comercio", name: "Almacén Don Pedro", documentType: "CUIT", cuitCuil: "20-24567891-3", ivaType: "Monotributista", phone: "11 4455-7701", email: "donpedro@correo.com", street: "Italia", streetNumber: "820", balance: 0, floor: "", apartment: "", locality: "Haedo", province: "Buenos Aires", status: "Activo", notes: "Recibe pedidos los lunes y jueves." },
  { id: "c-145", code: "CLI-00145", type: "Comercio", name: "Mini Market Norte", documentType: "CUIT", cuitCuil: "30-73456789-1", ivaType: "Responsable inscripto", phone: "11 4766-0092", email: "administracion@mininorte.com.ar", street: "San Lorenzo", streetNumber: "560", balance: 0, floor: "", apartment: "", locality: "Villa Ballester", province: "Buenos Aires", status: "Activo", notes: "" },
  { id: "c-144", code: "CLI-00144", type: "Particular", name: "María Fernanda López", documentType: "CUIL", cuitCuil: "27-28345678-4", ivaType: "Consumidor final", phone: "11 6098-3321", email: "maria.lopez@email.com", street: "Las Heras", streetNumber: "112", balance: 0, floor: "2", apartment: "B", locality: "Castelar", province: "Buenos Aires", status: "Inactivo", notes: "Cliente sin actividad reciente." },
  { id: "c-143", code: "CLI-00143", type: "Distribuidor", name: "Alimentos La Estación", documentType: "CUIT", cuitCuil: "30-72345678-9", ivaType: "Responsable inscripto", phone: "11 4621-8800", email: "ventas@laestacion.com.ar", street: "Calle 25 de Mayo", streetNumber: "1010", balance: 0, floor: "", apartment: "", locality: "Ituzaingó", province: "Buenos Aires", status: "Activo", notes: "" },
];

export type ClientActivity = { type: string; code: string; date: string; summary: string; status: string; to: string };

export const SAMPLE_CLIENT_ACTIVITY: ClientActivity[] = [
  { type: "Pedido", code: "PC-000148", date: "24 sep 2026", summary: "Tallarines 500g y ravioles de verdura", status: "En preparación", to: "/ventas/pedidos" },
  { type: "Remito", code: "R-000092", date: "18 sep 2026", summary: "Entrega de 12 cajas", status: "Entregado", to: "/ventas/remitos" },
  { type: "Comprobante", code: "FC-000381", date: "18 sep 2026", summary: "Venta a $ 86.400", status: "Emitido", to: "/ventas/comprobantes" },
  { type: "Presupuesto", code: "PR-000064", date: "12 sep 2026", summary: "Pedido semanal a 8 productos", status: "Aceptado", to: "/ventas/presupuestos" },
  { type: "Recibo", code: "RC-000107", date: "10 sep 2026", summary: "Pago recibido a $ 86.400", status: "Registrado", to: "/ventas/recibos" },
  { type: "Devolución", code: "DV-000012", date: "03 sep 2026", summary: "1 caja de sorrentinos", status: "Resuelta", to: "/ventas/devoluciones" },
];

export type Product = {
  id: string;
  name: string;
  price: number;
  stock: string;
};

export const SAMPLE_PRODUCTS: Product[] = [
  { id: "p-1", name: "Tallarines 500g", price: 2000, stock: "Disponible" },
  { id: "p-2", name: "Ravioles verdura", price: 3500, stock: "A producir" },
  { id: "p-3", name: "Spaghetti 500g", price: 2200, stock: "Disponible" },
  { id: "p-4", name: "Ñoquis papa", price: 2800, stock: "Disponible" },
  { id: "p-5", name: "Sorrentinos jamón y queso", price: 4200, stock: "A producir" },
  { id: "p-6", name: "Fettuccine 500g", price: 2100, stock: "Disponible" },
];

export const ORDER_STATUSES = ["Pendiente", "En preparación", "Listo para remito", "Facturado", "Cancelado"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

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

export const SAMPLE_ORDERS: Order[] = [
  {
    id: "o-148",
    number: "PC-000148",
    clientId: "c-148",
    employeeId: "emp-2", date: "2026-09-24", deliveryAddressType: "client",
    deliveryDate: "2026-09-25",
    items: [
      { id: "oi-1", productId: "p-1", productName: "Tallarines 500g", quantity: 40, unitPrice: 2000, subtotal: 80000 },
      { id: "oi-2", productId: "p-2", productName: "Ravioles verdura", quantity: 18, unitPrice: 3500, subtotal: 63000 },
    ],
    subtotal: 143000,
    discount: 14600,
    total: 128400,
    status: "Facturado",
    observations: "Entrega por la mañana, verificar stock de ravioles."
  },
  {
    id: "o-147",
    number: "PC-000147",
    clientId: "c-147",
    employeeId: "emp-2", date: "2026-09-24", deliveryAddressType: "client",
    deliveryDate: "2026-09-26",
    items: [
      { id: "oi-3", productId: "p-3", productName: "Spaghetti 500g", quantity: 30, unitPrice: 2200, subtotal: 66000 },
    ],
    subtotal: 66000,
    discount: 0,
    total: 66000,
    status: "Pendiente",
    observations: ""
  },
  {
    id: "o-146",
    number: "PC-000146",
    clientId: "c-146",
    employeeId: "emp-3",
    date: "2026-09-23", 
    deliveryDate: "2026-09-24",
    deliveryAddressType: "custom", 
    customDeliveryAddress: "Av. Corrientes 1234, CABA",
    items: [
      { id: "oi-4", productId: "p-4", productName: "Ñoquis papa", quantity: 10, unitPrice: 2800, subtotal: 28000 },
      { id: "oi-5", productId: "p-5", productName: "Sorrentinos jamón y queso", quantity: 5, unitPrice: 4200, subtotal: 21000 },
    ],
    subtotal: 49000,
    discount: 0,
    total: 49000,
    status: "Listo para remito",
    observations: "Llamar antes de enviar."
  }
];

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
};

export type Invoice = {
  id: string;
  number: string;
  type: InvoiceType;
  date: string;
  dueDate: string;
  clientId: string;
  orderId?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  observations: string;

};

export const SAMPLE_INVOICES: Invoice[] = [
  {
    id: "inv-1",
    number: "FC-0001-00000381",
    type: "Factura A",
    date: "2026-09-18",
    dueDate: "2026-10-18",
    clientId: "c-148",
    orderId: "o-148",
    items: [
      { id: "ii-1", productId: "p-1", productName: "Tallarines 500g", quantity: 40, unitPrice: 2000, subtotal: 80000 },
      { id: "ii-2", productId: "p-2", productName: "Ravioles verdura", quantity: 18, unitPrice: 3500, subtotal: 63000 },
    ],
    subtotal: 143000,
    discount: 14600,
    tax: 26964,
    total: 155364,
    status: "Emitido",
    observations: "Pago a 30 días.",

  },
  {
    id: "inv-2",
    number: "FC-0001-00000382",
    type: "Factura B",
    date: "2026-09-20",
    dueDate: "2026-09-20",
    clientId: "c-144",
    items: [
      { id: "ii-3", productId: "p-3", productName: "Spaghetti 500g", quantity: 2, unitPrice: 2200, subtotal: 4400 },
    ],
    subtotal: 4400,
    discount: 0,
    tax: 924,
    total: 5324,
    status: "Emitido",
    observations: "",

  }
];


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

export const SAMPLE_BUDGETS: Budget[] = [
  {
    id: "bud-1",
    number: "PR-000064",
    date: "2026-09-12",
    validUntil: "2026-09-26",
    clientId: "c-148",
    items: [
      { id: "bi-1", productId: "p-1", productName: "Tallarines 500g", quantity: 20, unitPrice: 2000, subtotal: 40000 },
      { id: "bi-2", productId: "p-2", productName: "Ravioles verdura", quantity: 10, unitPrice: 3500, subtotal: 35000 },
    ],
    subtotal: 75000,
    discount: 5000,
    total: 70000,
    status: "Aceptado",
    observations: "Pedido semanal a 8 productos."
  },
  {
    id: "bud-2",
    number: "PR-000065",
    date: "2026-09-15",
    validUntil: "2026-09-30",
    clientId: "c-144",
    items: [
      { id: "bi-3", productId: "p-3", productName: "Spaghetti 500g", quantity: 50, unitPrice: 2200, subtotal: 110000 },
    ],
    subtotal: 110000,
    discount: 10000,
    total: 100000,
    status: "Enviado",
    observations: "Presupuesto especial por cantidad."
  }
];


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

export const SAMPLE_REMITS: Remit[] = [
  {
    id: "rem-1",
    number: "R-0001-00000092",
    date: "2026-09-18",
    clientId: "c-148",
    orderId: "o-148",
    items: [
      { id: "ri-1", productId: "p-1", productName: "Tallarines 500g", quantity: 40 },
      { id: "ri-2", productId: "p-2", productName: "Ravioles verdura", quantity: 18 }
    ],
    status: "Entregado",
    observations: "Entrega completada sin novedades."
  }
];

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

export const SAMPLE_CUSTOMER_RETURNS: CustomerReturn[] = [
  {
    id: "ret-12",
    number: "DV-0001-00000012",
    date: "2026-09-20",
    clientId: "c-148",
    remitId: "rem-1",
    orderId: "o-148",
    invoiceId: "inv-1",
    items: [
      {
        id: "rdi-1",
        productId: "p-2",
        productName: "Ravioles verdura",
        deliveredQuantity: 18,
        previouslyReturnedQuantity: 0,
        availableQuantity: 18,
        quantity: 1,
        unitPrice: 3500,
        subtotal: 3500,
      },
    ],
    reason: "Producto dañado",
    observations: "Se recibió una unidad con el envase abierto.",
    estimatedRefundTotal: 3500,
    status: "Registrada",
  },
];

export function getRegisteredReturnedQuantity(remitId: string, productId: string, excludingReturnId?: string) {
  return SAMPLE_CUSTOMER_RETURNS
    .filter(customerReturn => customerReturn.status === "Registrada" && customerReturn.remitId === remitId && customerReturn.id !== excludingReturnId)
    .flatMap(customerReturn => customerReturn.items)
    .filter(item => item.productId === productId)
    .reduce((total, item) => total + item.quantity, 0);
}

export function getRemitAvailableQuantity(remit: Remit, productId: string, excludingReturnId?: string) {
  const remitItem = remit.items.find(item => item.productId === productId);
  if (!remitItem) return 0;
  return Math.max(0, remitItem.quantity - getRegisteredReturnedQuantity(remit.id, productId, excludingReturnId));
}

export const PAYMENT_METHODS = ["Efectivo", "Transferencia", "Cheque", "Tarjeta de Crédito", "Tarjeta de Débito"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

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
  id: string;
  number: string;
  date: string;
  clientId: string;
  invoices: ReceiptInvoiceDetail[];
  payments: ReceiptPaymentDetail[];
  total: number;
  status: ReceiptStatus;
  observations: string;
};

export const SAMPLE_RECEIPTS: Receipt[] = [
  {
    id: "rec-1",
    number: "RC-0001-00000107",
    date: "2026-09-21",
    clientId: "c-144",
    invoices: [
      { invoiceId: "inv-2", invoiceNumber: "FC-0001-00000382", amountApplied: 5324 }
    ],
    payments: [
      { id: "pay-1", method: "Transferencia", amount: 5324, reference: "TR-998822" }
    ],
    total: 5324,
    status: "Registrado",
    observations: "Pago completo de la factura."
  }
];

// Solo los recibos registrados afectan el saldo. Un borrador no representa un cobro.
export function getInvoicePaymentSummary(invoice: Invoice, excludingReceiptId?: string) {
  const paid = SAMPLE_RECEIPTS
    .filter(receipt => receipt.status === "Registrado" && receipt.id !== excludingReceiptId && receipt.clientId === invoice.clientId)
    .flatMap(receipt => receipt.invoices)
    .filter(detail => detail.invoiceId === invoice.id)
    .reduce((sum, detail) => sum + detail.amountApplied, 0);
  const balance = Math.max(0, Math.round((invoice.total - paid) * 100) / 100);
  return { paid: Math.round(paid * 100) / 100, balance };
}
