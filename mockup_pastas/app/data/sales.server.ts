import { getCatalogs } from "./catalogs.server";
import { validatePhones } from "./phones";
import { validCatalogValue, deliveryNeedsAddress, catalogAddressData, type Catalogs } from "./catalogs";
import { validateTabulatedAddress } from "./domicilios";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import {
  normalizeClient,
  getClientAddresses,
  validateClientAddresses,
  formatClientAddress,
  ORDER_STATUSES,
  ORDER_KINDS,
  COUNTER_CLIENT,
  SAMPLE_CLIENTS,
  SAMPLE_ORDERS,
  SAMPLE_PRODUCTS,
  SAMPLE_INVOICES,
  SAMPLE_RECEIPTS,
  type Invoice,
  type Receipt,
  type Client,
  type Order,
  type OrderItem,
  type OrderStatus,
} from "~/data/sales";
import { SAMPLE_EMPLOYEES } from "~/data/employees";
import { customerAsClient } from "~/data/customer.server";
import { getUsers, mutateUser, type Role } from "~/utils/db.server";
import { getClientMonthlyAccount, invoiceAmounts, money } from "~/data/billing";

type SalesData = { clients: Client[]; orders: Order[]; invoices: Invoice[]; receipts: Receipt[] };
const SALES_PATH = path.join(process.cwd(), "data", "sales.json");
let writeQueue: Promise<unknown> = Promise.resolve();

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(operation, operation);
  writeQueue = next.catch(() => undefined);
  return next;
}

async function readSalesData(): Promise<SalesData> {
  await fs.mkdir(path.dirname(SALES_PATH), { recursive: true });
  try {
    const raw = await fs.readFile(SALES_PATH, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as SalesData).clients) || !Array.isArray((parsed as SalesData).orders)) {
      throw new Error("El archivo de Ventas tiene un formato inválido.");
    }
    const data = parsed as SalesData;
    return { ...data, clients: data.clients.map(normalizeClient), invoices: data.invoices ?? structuredClone(SAMPLE_INVOICES), receipts: data.receipts ?? structuredClone(SAMPLE_RECEIPTS) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw new Error("No se pudieron leer los datos de Ventas; se preservó el archivo existente.");
    const initial = { clients: structuredClone(SAMPLE_CLIENTS), orders: structuredClone(SAMPLE_ORDERS), invoices: structuredClone(SAMPLE_INVOICES), receipts: structuredClone(SAMPLE_RECEIPTS) };
    await writeSalesData(initial);
    return initial;
  }
}

async function writeSalesData(data: SalesData) {
  const temporaryPath = `${SALES_PATH}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryPath, JSON.stringify(data, null, 2), { encoding: "utf8", flag: "wx" });
    await fs.rename(temporaryPath, SALES_PATH);
  } catch (error) {
    await fs.rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

export async function mutateSalesData<T>(operation: (data: SalesData) => Promise<T>) {
  return serialize(async () => {
    const data = await readSalesData();
    const result = await operation(data);
    await writeSalesData(data);
    return result;
  });
}

export async function getSalesData() {
  const [data, users] = await Promise.all([serialize(readSalesData), getUsers()]);
  const registeredClients = users.map(customerAsClient).filter((client): client is Client => client !== null);
  const registeredOrders = users.flatMap((user) => user.customerOrders ?? []);
  const orders = [...registeredOrders, ...data.orders].map(order => order.status !== "Cancelado" && data.invoices.some(invoice => invoice.orderId === order.id && invoice.status === "Emitido" && invoice.type !== "Nota de Crédito") ? { ...order, status: "Facturado" as const } : order);
  const clients = [...registeredClients, ...data.clients, COUNTER_CLIENT].map(client => ({ ...client, balance: money(getClientMonthlyAccount(client, orders, data.invoices, data.receipts).reduce((sum, month) => sum + month.balance, 0)) }));
  return { clients, orders, invoices: data.invoices, receipts: data.receipts };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function text(value: unknown, maxLength: number, required = false) {
  if (typeof value !== "string" || value.length > maxLength || (required && !value.trim())) return null;
  return value.trim();
}

const isOneOf = <T extends readonly string[]>(value: unknown, choices: T): value is T[number] => typeof value === "string" && choices.includes(value);
const validDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
};

function validateClient(value: unknown, catalogs: Catalogs, previous?: Client): Omit<Client, "id" | "code"> | null {
  const row = asRecord(value);
  if (!row) return null;
  const addresses = row.addresses === undefined ? undefined : validateClientAddresses(row.addresses, previous ? getClientAddresses(previous) : [], catalogAddressData(catalogs));
  const primary = addresses?.[0];
  const location = addresses ? primary ?? { street: "", streetNumber: "", floor: "", apartment: "", locality: "", province: "Buenos Aires" } : row;
  const name = text(row.name, 100, true);
  const { phone, additionalPhones } = validatePhones(row.phone, row.additionalPhones === undefined ? previous?.additionalPhones : row.additionalPhones);
  const email = text(row.email, 254);
  const street = text(location.street, 160);
  const streetNumber = text(location.streetNumber, 20);
  const balance = 0;
  const floor = text(location.floor ?? "", 20);
  const apartment = text(location.apartment ?? "", 20);
  const locality = text(location.locality, 100);
  const province = text(location.province, 100, true);
  const cuitCuil = text(row.cuitCuil, 30);
  const notes = text(row.notes, 2000);
  if (!name || email === null || (email && !/^\S+@\S+\.\S+$/.test(email)) || street === null || streetNumber === null || floor === null || apartment === null || locality === null || !province || cuitCuil === null || notes === null) return null;
  if (!validCatalogValue(catalogs, "tipos-cliente", row.type, previous?.type) || !validCatalogValue(catalogs, "tipos-documento", row.documentType, previous?.documentType) || (row.ivaType !== "" && !validCatalogValue(catalogs, "tipos-iva", row.ivaType, previous?.ivaType)) || !isOneOf(row.status, ["Activo", "Inactivo"] as const)) return null;
  if (!street || !streetNumber || !locality) throw new Error("Ingresá la dirección fija de facturación del cliente.");
  if (!addresses) validateTabulatedAddress({ street, streetNumber, locality, province, floor, apartment }, previous ? { ...previous, floor: previous.floor ?? "", apartment: previous.apartment ?? "" } : undefined, catalogAddressData(catalogs));
  return { type: row.type, name, documentType: row.documentType, cuitCuil, ivaType: row.ivaType, phone, additionalPhones, email, addresses, street, streetNumber, balance, floor, apartment, locality, province, status: row.status, notes };
}

export function preserveOrderAddresses(orders: Order[], client: Client) {
  return orders.map((order) => {
    if (order.clientId !== client.id || order.deliveryAddress) return order;
    const address = getClientAddresses(client)[0];
    return { ...order, deliveryAddressType: order.deliveryAddressType ?? "client", deliveryAddressId: order.deliveryAddressType === "custom" ? undefined : address?.id, deliveryAddress: order.deliveryAddressType === "custom" ? order.customDeliveryAddress : address ? formatClientAddress(address) : undefined };
  });
}

export async function saveSalesClient(input: unknown, id: string | undefined, actorRole: Role) {
  if (actorRole !== "Administrador" && actorRole !== "Ventas") throw new Error("No tenés permiso para guardar clientes.");
  const previous = id ? (await getSalesData()).clients.find(candidate => candidate.id === id) : undefined;
  const client = validateClient(input, await getCatalogs(), previous);
  if (!client) throw new Error("Revisá los datos ingresados del cliente.");
  if (id?.startsWith("customer-")) {
    const userId = id.slice("customer-".length);
    const user = (await getUsers()).find((candidate) => candidate.id === userId && candidate.role === "Cliente");
    if (!user) throw new Error("La cuenta de cliente ya no existe.");
    await mutateUser(user.id, (current) => {
      if (current.role !== "Cliente") throw new Error("La cuenta de cliente ya no existe.");
      const previousType = current.customerData?.type ?? "Particular";
      if (client.type !== previousType && actorRole !== "Administrador") throw new Error("Solo un administrador puede cambiar la condición del cliente.");
      current.customerOrders = preserveOrderAddresses(current.customerOrders ?? [], customerAsClient(current)!);
      current.name = client.name;
      current.phone = client.phone;
      current.additionalPhones = client.additionalPhones;
      current.address = [client.street, client.streetNumber].filter(Boolean).join(" ");
      current.customerData = { addresses: client.addresses, street: client.street, streetNumber: client.streetNumber, balance: client.balance, type: client.type, documentType: client.documentType, cuitCuil: client.cuitCuil, ivaType: client.ivaType, floor: client.floor ?? "", apartment: client.apartment ?? "", locality: client.locality, province: client.province, notes: client.notes };
      current.customerStatus = client.status;
    });
    return;
  }
  await serialize(async () => {
    const data = await readSalesData();
    if (id) {
      const index = data.clients.findIndex((entry) => entry.id === id);
      if (index < 0) throw new Error("El cliente ya no existe.");
      if (client.type !== data.clients[index].type && actorRole !== "Administrador") throw new Error("Solo un administrador puede cambiar la condición del cliente.");
      data.orders = preserveOrderAddresses(data.orders, data.clients[index]);
      data.clients[index] = { ...client, id, code: data.clients[index].code };
    } else {
      const next = Math.max(0, ...data.clients.map((entry) => Number(entry.code.match(/\d+$/)?.[0] ?? 0))) + 1;
      data.clients.unshift({ ...client, id: `c-${crypto.randomUUID()}`, code: `CLI-${String(next).padStart(5, "0")}` });
    }
    await writeSalesData(data);
  });
}

function validateOrder(value: unknown, clients: Client[], catalogs: Catalogs, existing?: Order): Order {
  const row = asRecord(value);
  if (!row) throw new Error("El pedido enviado no es válido.");
  const kind = row.kind ?? existing?.kind ?? "Regular";
  if (!isOneOf(kind, ORDER_KINDS)) throw new Error("El tipo de pedido no es válido.");
  if (existing && kind !== (existing.kind ?? "Regular")) throw new Error("No se puede cambiar el tipo de un pedido existente.");
  const clientId = text(row.clientId || (kind === "Mostrador" ? COUNTER_CLIENT.id : ""), 100, true);
  if (!clientId) throw new Error("Seleccioná un cliente existente y activo.");
  const client = clients.find((candidate) => candidate.id === clientId && (candidate.status === "Activo" || existing?.clientId === candidate.id));
  if (!client) throw new Error("Seleccioná un cliente existente y activo.");
  if (client.id === COUNTER_CLIENT.id && kind !== "Mostrador") throw new Error("Los pedidos regulares y eventos requieren un cliente.");
  if (existing && clientId !== existing.clientId) throw new Error("No se puede reasignar un pedido existente a otra cuenta.");
  const date = text(row.date, 10, true);
  const deliveryDate = text(row.deliveryDate, 10);
  const fulfillment = row.fulfillment ?? existing?.fulfillment ?? (kind === "Mostrador" ? "Retiro en local" : "Envío");
  if (!validCatalogValue(catalogs, "modalidades-entrega", fulfillment, existing?.fulfillment)) throw new Error("Seleccioná una modalidad de entrega activa.");
  const needsAddress = deliveryNeedsAddress(catalogs, fulfillment);
  const deliveryTime = text(row.deliveryTime ?? "", 5);
  if (kind === "Evento" && (!deliveryDate || !validDate(deliveryDate) || !date || deliveryDate < date || !deliveryTime || !/^([01]\d|2[0-3]):[0-5]\d$/.test(deliveryTime))) throw new Error("El evento requiere un día y una hora válidos de retiro o envío, posteriores a la fecha del pedido.");
  const observations = text(row.observations, 2000);
  const employeeId = text(row.employeeId ?? "", 100);
  const deliveryAddressType = row.deliveryAddressType;
  const customAddress = text(row.customDeliveryAddress ?? "", 500);
  const addresses = getClientAddresses(client);
  const deliveryAddressId = text(row.deliveryAddressId ?? addresses[0]?.id ?? "", 120);
  const selectedAddress = addresses.find((address) => address.id === deliveryAddressId);
  const retainedAddress = existing?.deliveryAddressType === "client" && existing.deliveryAddressId === deliveryAddressId ? existing.deliveryAddress : undefined;
  if (needsAddress && deliveryAddressType === "client" && !retainedAddress && (!selectedAddress || !selectedAddress.street || !selectedAddress.locality)) throw new Error("Seleccioná una dirección guardada del cliente.");
  const deliveryAddress = !needsAddress ? fulfillment : deliveryAddressType === "custom" ? customAddress || "" : retainedAddress ?? (selectedAddress ? formatClientAddress(selectedAddress) : "");
  if (!date || !validDate(date) || deliveryDate === null || (deliveryDate && !validDate(deliveryDate)) || observations === null || !employeeId || !SAMPLE_EMPLOYEES.some((employee) => employee.id === employeeId && employee.status === "Activo") || (deliveryAddressType !== "client" && deliveryAddressType !== "custom") || customAddress === null || (needsAddress && deliveryAddressType === "custom" && !customAddress)) throw new Error("Revisá el vendedor, las fechas, la dirección y las observaciones del pedido.");
  if (!Array.isArray(row.items) || row.items.length < 1 || row.items.length > 100) throw new Error("El pedido debe incluir productos válidos.");
  const items: OrderItem[] = row.items.map((rawItem, index) => {
    const item = asRecord(rawItem);
    const productId = item && text(item.productId, 80, true);
    const product = SAMPLE_PRODUCTS.find((candidate) => candidate.id === productId);
    const quantity = item?.quantity;
    if (!item || !product || !Number.isSafeInteger(quantity) || (quantity as number) <= 0 || (quantity as number) > 100000) throw new Error("Hay un producto o una cantidad inválida.");
    const subtotal = product.price * (quantity as number);
    if (!Number.isSafeInteger(subtotal)) throw new Error("El total del pedido excede el máximo permitido.");
    return { id: `oi-${crypto.randomUUID()}-${index}`, productId: product.id, productName: product.name, quantity: quantity as number, unitPrice: product.price, subtotal };
  });
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  if (!Number.isSafeInteger(subtotal)) throw new Error("El subtotal del pedido excede el máximo permitido.");
  const discount = row.discount;
  if (!Number.isSafeInteger(discount) || (discount as number) < 0 || (discount as number) > subtotal) throw new Error("El descuento debe estar entre cero y el subtotal.");
  const requestedStatus = row.status;
  if (existing && requestedStatus !== existing.status) throw new Error("El estado del pedido debe cambiarse con la acción correspondiente.");
  const status = existing?.status ?? "Pendiente";
  if (!existing && requestedStatus !== undefined && requestedStatus !== status) throw new Error("El estado inicial no es válido.");
  return { id: existing?.id ?? `o-${crypto.randomUUID()}`, number: existing?.number ?? "", clientId, kind, fulfillment, deliveryTime: kind === "Evento" ? deliveryTime! : undefined, employeeId: employeeId || undefined, date, deliveryDate: deliveryDate || "", deliveryAddressType, deliveryAddressId: needsAddress && deliveryAddressType === "client" ? deliveryAddressId || undefined : undefined, deliveryAddress, customDeliveryAddress: needsAddress && deliveryAddressType === "custom" ? customAddress : undefined, items, subtotal, discount: discount as number, total: subtotal - (discount as number), status, observations };
}

async function findClient(id: string) {
  const users = await getUsers();
  const clients = users.map(customerAsClient).filter((client): client is Client => client !== null);
  const localData = await serialize(readSalesData);
  return { clients: [...clients, ...localData.clients, COUNTER_CLIENT] };
}

async function persistOrder(order: Order, previous?: Order) {
  const storedLocally = (await serialize(readSalesData)).orders.some(candidate => candidate.id === order.id);
  const userId = !storedLocally && order.clientId.startsWith("customer-") ? order.clientId.slice("customer-".length) : null;
  if (userId) {
    await mutateUser(userId, (user) => {
      const orders = [...(user.customerOrders ?? [])];
      const index = orders.findIndex((item) => item.id === (previous?.id ?? order.id));
      if (index < 0 && previous) throw new Error("El pedido ya no existe.");
      if (index >= 0) {
        if (previous && orders[index].status !== previous.status) throw new Error("El pedido cambió mientras lo editabas. Actualizá la página y volvé a intentarlo.");
        orders[index] = { ...order, status: orders[index].status, number: orders[index].number };
      }
      else orders.unshift(order);
      user.customerOrders = orders;
    });
  } else {
    await serialize(async () => {
      const data = await readSalesData();
      const index = data.orders.findIndex((item) => item.id === (previous?.id ?? order.id));
      if (index < 0 && previous) throw new Error("El pedido ya no existe.");
      if (index >= 0) {
        if (previous && data.orders[index].status !== previous.status) throw new Error("El pedido cambió mientras lo editabas. Actualizá la página y volvé a intentarlo.");
        data.orders[index] = { ...order, status: data.orders[index].status, number: data.orders[index].number };
      }
      else data.orders.unshift(order);
      await writeSalesData(data);
    });
  }
}

export async function saveSalesOrder(input: unknown, id?: string) {
  const { clients } = await findClient(typeof asRecord(input)?.clientId === "string" ? asRecord(input)!.clientId as string : "");
  const previous = id ? (await getSalesData()).orders.find((item) => item.id === id) : undefined;
  if (id && !previous) throw new Error("El pedido ya no existe.");
  const normalizedInput = asRecord(input);
  const catalogs = await getCatalogs();
  const order = validateOrder({ ...normalizedInput, status: previous?.status ?? normalizedInput?.status }, clients, catalogs, previous);
  if (!id) order.number = `PC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  else order.number = previous!.number;
  if (previous && (previous.status === "Cancelado" || previous.status === "Facturado")) throw new Error("No se pueden editar pedidos cancelados o facturados.");
  if (order.kind === "Evento") {
    await mutateSalesData(async data => {
      const current = data.orders.find(candidate => candidate.id === order.id);
      if (previous && (!current || current.status !== previous.status)) throw new Error("El pedido cambió. Actualizá la página.");
      if (data.invoices.some(invoice => invoice.orderId === order.id && invoice.status !== "Anulado")) throw new Error("El evento ya tiene un comprobante. Anulalo antes de editar el pedido.");
      const client = clients.find(client => client.id === order.clientId)!;
      const finalTotal = invoiceAmounts(order.items, client.type, order.discount).total;
      const minimum = Math.ceil(Math.round(finalTotal * 100) / 2) / 100;
      const existingDeposit = data.receipts.find(receipt => receipt.advanceOrderId === order.id && receipt.status === "Registrado");
      if (existingDeposit) {
        if (existingDeposit.total < minimum || existingDeposit.total > finalTotal) throw new Error("La seña registrada no cubre entre el 50% y el total actualizado. Anulá ese recibo y registrá la seña correcta al guardar el evento.");
      } else {
        const deposit = asRecord(normalizedInput?.deposit);
        const amount = deposit?.amount;
        const reference = text(deposit?.reference ?? "", 200);
        if (typeof amount !== "number" || !Number.isFinite(amount) || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001 || amount < minimum || amount > finalTotal || amount <= 0 || !validCatalogValue(catalogs, "medios-pago", deposit?.method) || reference === null) throw new Error(`El evento requiere cobrar una seña de al menos $${minimum.toFixed(2)} y no mayor al total.`);
        data.receipts.unshift({ id: `rec-${crypto.randomUUID()}`, number: `RC-0001-${String(Math.max(0, ...data.receipts.map(receipt => Number(receipt.number.slice(-8)) || 0)) + 1).padStart(8, "0")}`, date: order.date, clientId: order.clientId, advanceOrderId: order.id, invoices: [], payments: [{ id: crypto.randomUUID(), method: deposit.method, amount, reference }], total: amount, status: "Registrado", observations: `Seña de evento ${order.number}` });
      }
      if (current) data.orders[data.orders.indexOf(current)] = order;
      else data.orders.unshift(order);
    });
    return order;
  }
  await persistOrder(order, previous);
  return order;
}

export async function changeSalesOrderStatus(id: string, status: unknown) {
  const { invoices, orders, receipts, clients } = await getSalesData();
  const event = orders.find(order => order.id === id && order.kind === "Evento");
  if (event && status !== "Cancelado") {
    const total = invoiceAmounts(event.items, clients.find(client => client.id === event.clientId)!.type, event.discount).total;
    const paid = receipts.filter(receipt => receipt.advanceOrderId === id && receipt.status === "Registrado").reduce((sum, receipt) => sum + receipt.total, 0);
    if (Math.round(paid * 100) < Math.ceil(Math.round(total * 100) / 2)) throw new Error("El evento debe tener registrada una seña de al menos el 50%.");
  }
  if (invoices.some(invoice => invoice.orderId === id && invoice.status === "Emitido")) throw new Error("El pedido ya está facturado. Anulá su comprobante antes de modificar el estado.");
  if (!isOneOf(status, ORDER_STATUSES)) throw new Error("El estado solicitado no es válido.");
  const allowed: Record<OrderStatus, readonly OrderStatus[]> = {
    "Pendiente": ["En preparación", "Cancelado"],
    "En preparación": ["Listo para remito", "Cancelado"],
    "Listo para remito": ["Facturado", "Cancelado"],
    "Facturado": [],
    "Cancelado": [],
  };
  const users = await getUsers();
  const owner = users.find((user) => user.customerOrders?.some((order) => order.id === id));
  if (owner) {
    await mutateUser(owner.id, (user) => {
      const orders = [...(user.customerOrders ?? [])];
      const index = orders.findIndex((order) => order.id === id);
      if (index < 0) throw new Error("El pedido ya no existe.");
      const current = orders[index];
      if (status !== current.status && !allowed[current.status].includes(status)) throw new Error("No se puede cambiar el pedido a ese estado.");
      orders[index] = { ...current, status };
      user.customerOrders = orders;
    });
    return;
  }
  await serialize(async () => {
    const data = await readSalesData();
    const index = data.orders.findIndex((order) => order.id === id);
    if (index < 0) throw new Error("El pedido ya no existe.");
    const current = data.orders[index];
    if (status !== current.status && !allowed[current.status].includes(status)) throw new Error("No se puede cambiar el pedido a ese estado.");
    data.orders[index] = { ...current, status };
    await writeSalesData(data);
  });
}
