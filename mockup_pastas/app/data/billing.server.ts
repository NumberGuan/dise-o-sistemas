import { cashReceiptFields, type CashActor } from "./cash";
import { getCatalogs } from "./catalogs.server";
import { validCatalogValue } from "./catalogs";
import crypto from "node:crypto";
import { mutateSalesData } from "~/data/sales.server";
import { customerAsClient } from "~/data/customer.server";
import { getUsers } from "~/utils/db.server";
import { invoiceAmounts, getClientMonthlyAccount, money } from "~/data/billing";
import { getInvoicePaymentSummary, formatClientAddress, COUNTER_CLIENT, INVOICE_STATUSES, INVOICE_TYPES, RECEIPT_STATUSES, type Client, type Invoice, type Receipt } from "~/data/sales";

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Los datos enviados no son válidos.");
  return value as Record<string, unknown>;
}
function string(value: unknown, max = 2000) {
  if (typeof value !== "string" || value.length > max) throw new Error("Hay datos incompletos o demasiado largos.");
  return value.trim();
}
function date(value: unknown) {
  const text = string(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(`${text}T12:00:00Z`)) || new Date(`${text}T12:00:00Z`).toISOString().slice(0, 10) !== text) throw new Error("La fecha no es válida.");
  return text;
}
function amount(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 999999999.99 || Math.abs(value * 100 - Math.round(value * 100)) > 0.0001) throw new Error("El importe no es válido.");
  return money(value);
}
function choice<T extends readonly string[]>(value: unknown, choices: T): T[number] {
  if (typeof value !== "string" || !choices.includes(value)) throw new Error("El estado o tipo no es válido.");
  return value;
}

export async function saveSalesInvoice(input: unknown, id?: string) {
  return mutateSalesData(async data => {
    const row = record(input);
    const previous = id ? data.invoices.find(invoice => invoice.id === id) : undefined;
    if (id && !previous) throw new Error("El comprobante ya no existe.");
    const status = choice(row.status, INVOICE_STATUSES);
    if (previous && previous.status !== "Borrador") {
      if (previous.status !== "Emitido" || status !== "Anulado") throw new Error("Solo se pueden editar comprobantes en borrador.");
      if (getInvoicePaymentSummary(previous, undefined, data.receipts).paid > 0) throw new Error("Anulá los recibos registrados antes de anular la factura.");
      data.invoices[data.invoices.indexOf(previous)] = { ...previous, status };
      return;
    }
    if (status === "Anulado") throw new Error("No se puede crear una factura anulada.");
    const users = await getUsers();
    const clients = [...data.clients, COUNTER_CLIENT, ...users.map(customerAsClient).filter((client): client is Client => client !== null)];
    const orders = [...data.orders, ...users.flatMap(user => user.customerOrders ?? [])];
    const orderId = string(row.orderId, 120);
    const order = orders.find(order => order.id === orderId && order.status !== "Cancelado");
    const client = clients.find(client => client.id === order?.clientId);
    if (!order || !client || row.clientId !== client.id) throw new Error("Seleccioná un pedido y su cliente.");
    if (data.invoices.some(invoice => invoice.id !== id && invoice.orderId === orderId && invoice.status !== "Anulado")) throw new Error("El pedido ya tiene un comprobante activo.");
    const invoiceDate = date(row.date);
    const dueDate = date(row.dueDate);
    if (dueDate < invoiceDate) throw new Error("El vencimiento no puede ser anterior a la emisión.");
    const totals = invoiceAmounts(order.items, client.type, order.discount);
    amount(totals.total);
    const invoice: Invoice = { ...totals, id: previous?.id ?? `inv-${crypto.randomUUID()}`, number: previous?.number ?? `FC-0001-${String(Math.max(0, ...data.invoices.map(invoice => Number(invoice.number.slice(-8)) || 0)) + 1).padStart(8, "0")}`, clientId: client.id, billingAddress: formatClientAddress(client), orderId, date: invoiceDate, dueDate, type: choice(row.type, INVOICE_TYPES), status, observations: string(row.observations ?? "") };
    if (order.kind === "Evento" && invoice.type === "Nota de Crédito") throw new Error("Facturá el evento con una factura o nota de débito.");
    if (order.kind === "Evento" && status === "Emitido") {
      const deposits = data.receipts.filter(receipt => receipt.advanceOrderId === order.id && receipt.status === "Registrado");
      const paid = money(deposits.reduce((sum, receipt) => sum + receipt.total, 0));
      if (Math.round(paid * 100) < Math.ceil(Math.round(invoice.total * 100) / 2) || paid > invoice.total) throw new Error("El evento requiere una seña registrada de al menos el 50% del total a facturar.");
      for (const deposit of deposits) deposit.invoices = [{ invoiceId: invoice.id, invoiceNumber: invoice.number, amountApplied: deposit.total }];
    }
    if (previous) data.invoices[data.invoices.indexOf(previous)] = invoice;
    else data.invoices.unshift(invoice);
  });
}

export async function saveSalesReceipt(input: unknown, id?: string, actor?: CashActor) {
  const catalogs = await getCatalogs();
  return mutateSalesData(async data => {
    const row = record(input);
    const previous = id ? data.receipts.find(receipt => receipt.id === id) : undefined;
    if (id && !previous) throw new Error("El recibo ya no existe.");
    const status = choice(row.status, RECEIPT_STATUSES);
    if (previous && previous.status !== "Borrador") {
      if (previous.status !== "Registrado" || status !== "Anulado") throw new Error("Solo se pueden editar recibos en borrador.");
      if (previous.cashSessionId && data.cashSessions.find(session => session.id === previous.cashSessionId)?.closedAt) throw new Error("El recibo pertenece a una caja cerrada. Registrá un ajuste en una caja abierta para documentar la corrección.");
      data.receipts[data.receipts.indexOf(previous)] = { ...previous, status };
      return;
    }
    if (status === "Anulado") throw new Error("No se puede crear un recibo anulado.");
    const users = await getUsers();
    const clients = [...data.clients, COUNTER_CLIENT, ...users.map(customerAsClient).filter((client): client is Client => client !== null)];
    const clientId = string(row.clientId, 120);
    const client = clients.find(client => client.id === clientId);
    if (!client) throw new Error("Seleccioná un cliente existente.");
    const receiptDate = date(row.date);
    if (!Array.isArray(row.invoices) || row.invoices.length > 500 || !Array.isArray(row.payments) || row.payments.length > 100) throw new Error("Los detalles del recibo no son válidos.");
    const invoices = row.invoices.map(raw => {
      const detail = record(raw);
      const invoice = data.invoices.find(invoice => invoice.id === detail.invoiceId && invoice.clientId === clientId && invoice.status === "Emitido" && invoice.type !== "Nota de Crédito");
      if (!invoice) throw new Error("Seleccioná facturas emitidas del cliente.");
      const applied = amount(detail.amountApplied);
      if (applied <= 0 || applied > getInvoicePaymentSummary(invoice, id, data.receipts).balance) throw new Error(`Revisá el importe aplicado a ${invoice.number}.`);
      return { invoiceId: invoice.id, invoiceNumber: invoice.number, amountApplied: applied };
    });
    if (new Set(invoices.map(detail => detail.invoiceId)).size !== invoices.length) throw new Error("No se puede aplicar dos veces la misma factura.");
    const payments = row.payments.map(raw => {
      const payment = record(raw);
      const paid = amount(payment.amount);
      if (paid <= 0) throw new Error("Cada pago debe ser positivo.");
      const method = payment.method;
      const retained = previous?.payments.some(item => item.method === method);
      if (!validCatalogValue(catalogs, "medios-pago", method, retained && typeof method === "string" ? method : undefined)) throw new Error("Seleccioná un método de pago activo.");
      return { id: crypto.randomUUID(), method, amount: paid, reference: string(payment.reference ?? "", 200) };
    });
    const total = amount(money(payments.reduce((sum, payment) => sum + payment.amount, 0)));
    const applied = money(invoices.reduce((sum, detail) => sum + detail.amountApplied, 0));
    if (status === "Registrado" && (!invoices.length || !payments.length || total !== applied)) throw new Error("El total cobrado debe coincidir con el total aplicado a las facturas.");
    const accountMonth = row.accountMonth ? string(row.accountMonth, 7) : undefined;
    if (accountMonth) {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(accountMonth) || accountMonth >= receiptDate.slice(0, 7)) throw new Error("El saldo mensual se paga a partir del mes siguiente.");
      const orders = [...data.orders, ...users.flatMap(user => user.customerOrders ?? [])];
      const month = getClientMonthlyAccount(client, orders, data.invoices, data.receipts.filter(receipt => receipt.id !== id), receiptDate.slice(0, 7)).find(month => month.month === accountMonth);
      if (!month || month.unbilled || month.balance <= 0 || invoices.length !== month.invoiceIds.length || invoices.some(detail => !month.invoiceIds.includes(detail.invoiceId)) || applied !== month.balance) throw new Error("Para saldar el mes deben estar facturados todos sus pedidos e incluirse todo el saldo pendiente.");
    }
    const receipt: Receipt = { ...(status === "Registrado" ? cashReceiptFields(data.cashSessions, actor) : {}), id: previous?.id ?? `rec-${crypto.randomUUID()}`, number: previous?.number ?? `RC-0001-${String(Math.max(0, ...data.receipts.map(receipt => Number(receipt.number.slice(-8)) || 0)) + 1).padStart(8, "0")}`, clientId, date: receiptDate, invoices, payments, total, status, observations: string(row.observations ?? ""), accountMonth };
    if (previous) data.receipts[data.receipts.indexOf(previous)] = receipt;
    else data.receipts.unshift(receipt);
  });
}
