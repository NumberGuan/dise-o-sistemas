import type { Producto } from "./produccion";

export const DONATION_EXPIRY_DAYS = 7;
export type DonationItem = {
  productId: number;
  productName: string;
  unitId: number;
  expirationDate: string;
  quantity: number;
  unitPrice: 0;
  subtotal: 0;
};
export type Donation = {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  date: string;
  items: DonationItem[];
  total: 0;
  observations: string;
};

export function validDonationDate(date: unknown): date is string {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T12:00:00Z`);
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === date;
}

export function daysToExpiration(expirationDate: string, date: string) {
  return (Date.parse(`${expirationDate}T12:00:00Z`) - Date.parse(`${date}T12:00:00Z`)) / 86400000;
}

export function canDonateProduct(product: Producto, date: string) {
  if (!validDonationDate(date) || !validDonationDate(product.fechaVencimiento)) return false;
  const days = daysToExpiration(product.fechaVencimiento, date);
  return product.stockProducto > 0 && days >= 0 && days <= DONATION_EXPIRY_DAYS;
}

// Producción usa stock de muestra. El registro persistente reserva lo ya donado
// para que dos donaciones no puedan asignar las mismas existencias.
export function donationAvailability(product: Producto, donations: Donation[]) {
  const donated = donations.flatMap(donation => donation.items)
    .filter(item => item.productId === product.idProducto && item.expirationDate === product.fechaVencimiento)
    .reduce((sum, item) => sum + item.quantity, 0);
  return Math.max(0, Math.round((product.stockProducto - donated) * 1000) / 1000);
}
