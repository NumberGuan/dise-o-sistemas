export const PURCHASE_DOCUMENTS = {
  presupuesto: { title: "Presupuesto Proveedor", path: "presupuesto-proveedor" },
  factura: { title: "Factura Proveedor", path: "factura-proveedor" },
  recibo: { title: "Recibo de Pago Proveedor", path: "recibo-pago-proveedor" },
  remito: { title: "Remito Proveedor", path: "remito-proveedor" },
} as const;
export type PurchaseDocumentKind = keyof typeof PURCHASE_DOCUMENTS;
