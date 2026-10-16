import { getInvoicePaymentSummary, type Client, type Invoice, type InvoiceItem, type Order, type Receipt } from "~/data/sales";

export const money = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

export function invoiceAmounts(items: InvoiceItem[], clientType: Client["type"], orderDiscount = 0) {
  const lines = items.map(item => {
    const subtotal = money(item.quantity * item.unitPrice);
    const discount = clientType === "Comercio" ? money(subtotal * 0.15) : 0;
    return { ...item, subtotal, discount, netSubtotal: money(subtotal - discount) };
  });
  const subtotal = money(lines.reduce((sum, item) => sum + item.subtotal, 0));
  const discount = clientType === "Comercio" ? money(lines.reduce((sum, item) => sum + item.discount, 0)) : money(orderDiscount);
  const taxableBase = money(Math.max(0, subtotal - discount));
  const tax = money(taxableBase * 0.21);
  return { items: lines, subtotal, discount, taxableBase, tax, total: money(taxableBase + tax), commercialDiscountRate: clientType === "Comercio" ? 15 : 0 };
}

export function currentSalesMonth(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit" }).formatToParts(date);
  return `${parts.find(part => part.type === "year")!.value}-${parts.find(part => part.type === "month")!.value}`;
}

export function nextSalesMonth(month: string) {
  const [year, number] = month.split("-").map(Number);
  return `${number === 12 ? year + 1 : year}-${String(number === 12 ? 1 : number + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string) {
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T12:00:00Z`));
}

export function getClientMonthlyAccount(client: Client, orders: Order[], invoices: Invoice[], receipts: Receipt[], asOfMonth = currentSalesMonth()) {
  if (client.type !== "Comercio") return [];
  const groups = new Map<string, { month: string; orderCount: number; total: number; paid: number; balance: number; unbilled: number; invoiceIds: string[]; payableFrom: string }>();
  for (const order of orders.filter(order => order.clientId === client.id && order.status !== "Cancelado")) {
    const month = order.date.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month) || month > asOfMonth) continue;
    const group = groups.get(month) ?? { month, orderCount: 0, total: 0, paid: 0, balance: 0, unbilled: 0, invoiceIds: [], payableFrom: nextSalesMonth(month) };
    const invoice = invoices.find(invoice => invoice.orderId === order.id && invoice.clientId === client.id && invoice.status === "Emitido" && invoice.type !== "Nota de Crédito");
    const amount = invoice ? invoice.total : invoiceAmounts(order.items, client.type, order.discount).total;
    const paid = invoice ? getInvoicePaymentSummary(invoice, undefined, receipts).paid : 0;
    group.orderCount += 1;
    group.total = money(group.total + amount);
    group.paid = money(group.paid + paid);
    group.balance = money(group.balance + Math.max(0, amount - paid));
    if (!invoice) group.unbilled += 1;
    else if (money(amount - paid) > 0) group.invoiceIds.push(invoice.id);
    groups.set(month, group);
  }
  return [...groups.values()].sort((a, b) => b.month.localeCompare(a.month));
}
