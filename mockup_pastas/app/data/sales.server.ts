import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import {
  normalizeClient,
  CLIENT_DOCUMENT_TYPES,
  CLIENT_IVA_TYPES,
  ORDER_STATUSES,
  SAMPLE_CLIENTS,
  SAMPLE_ORDERS,
  SAMPLE_PRODUCTS,
  type Client,
  type Order,
  type OrderItem,
  type OrderStatus,
} from "~/data/sales";
import { SAMPLE_EMPLOYEES } from "~/data/employees";
import { customerAsClient } from "~/data/customer.server";
import { getUsers, mutateUser, type Role } from "~/utils/db.server";

type SalesData = { clients: Client[]; orders: Order[] };
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
    return { ...data, clients: data.clients.map(normalizeClient) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw new Error("No se pudieron leer los datos de Ventas; se preservó el archivo existente.");
    const initial = { clients: structuredClone(SAMPLE_CLIENTS), orders: structuredClone(SAMPLE_ORDERS) };
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

export async function getSalesData() {
  const [data, users] = await Promise.all([serialize(readSalesData), getUsers()]);
  const registeredClients = users.map(customerAsClient).filter((client): client is Client => client !== null);
  const registeredOrders = users.flatMap((user) => user.customerOrders ?? []);
  return { clients: [...registeredClients, ...data.clients], orders: [...registeredOrders, ...data.orders] };
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

function validateClient(value: unknown): Omit<Client, "id" | "code"> | null {
  const row = asRecord(value);
  if (!row) return null;
  const name = text(row.name, 100, true);
  const phone = text(row.phone, 40);
  const email = text(row.email, 254);
  const street = text(row.street, 160);
  const streetNumber = text(row.streetNumber, 20);
  const balance = row.type === "Comercio" ? row.balance : 0;
  if (typeof balance !== "number" || !Number.isFinite(balance) || Math.abs(balance) > 999999999.99 || Math.abs(balance * 100 - Math.round(balance * 100)) > 0.0001) return null;
  const floor = text(row.floor ?? "", 20);
  const apartment = text(row.apartment ?? "", 20);
  const locality = text(row.locality, 100, true);
  const province = text(row.province, 100, true);
  const cuitCuil = text(row.cuitCuil, 30);
  const notes = text(row.notes, 2000);
  if (!name || phone === null || email === null || (email && !/^\S+@\S+\.\S+$/.test(email)) || street === null || streetNumber === null || floor === null || apartment === null || !locality || !province || cuitCuil === null || notes === null) return null;
  if (!isOneOf(row.type, ["Comercio", "Distribuidor", "Particular"] as const) || !isOneOf(row.documentType, CLIENT_DOCUMENT_TYPES) || !isOneOf(row.ivaType, ["", ...CLIENT_IVA_TYPES] as const) || !isOneOf(row.status, ["Activo", "Inactivo"] as const)) return null;
  return { type: row.type, name, documentType: row.documentType, cuitCuil, ivaType: row.ivaType, phone, email, street, streetNumber, balance, floor, apartment, locality, province, status: row.status, notes };
}

export async function saveSalesClient(input: unknown, id: string | undefined, actorRole: Role) {
  if (actorRole !== "Administrador" && actorRole !== "Ventas") throw new Error("No tenés permiso para guardar clientes.");
  const client = validateClient(input);
  if (!client) throw new Error("Revisá los datos ingresados del cliente.");
  if (id?.startsWith("customer-")) {
    const userId = id.slice("customer-".length);
    const user = (await getUsers()).find((candidate) => candidate.id === userId && candidate.role === "Cliente");
    if (!user) throw new Error("La cuenta de cliente ya no existe.");
    await mutateUser(user.id, (current) => {
      if (current.role !== "Cliente") throw new Error("La cuenta de cliente ya no existe.");
      const previousType = current.customerData?.type ?? "Particular";
      if (client.type !== previousType && actorRole !== "Administrador") throw new Error("Solo un administrador puede cambiar la condición del cliente.");
      current.name = client.name;
      current.phone = client.phone;
      current.address = [client.street, client.streetNumber].filter(Boolean).join(" ");
      current.customerData = { street: client.street, streetNumber: client.streetNumber, balance: client.balance, type: client.type, documentType: client.documentType, cuitCuil: client.cuitCuil, ivaType: client.ivaType, floor: client.floor ?? "", apartment: client.apartment ?? "", locality: client.locality, province: client.province, notes: client.notes };
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
      data.clients[index] = { ...client, id, code: data.clients[index].code };
    } else {
      const next = Math.max(0, ...data.clients.map((entry) => Number(entry.code.match(/\d+$/)?.[0] ?? 0))) + 1;
      data.clients.unshift({ ...client, id: `c-${crypto.randomUUID()}`, code: `CLI-${String(next).padStart(5, "0")}` });
    }
    await writeSalesData(data);
  });
}

function validateOrder(value: unknown, clients: Client[], existing?: Order): Order {
  const row = asRecord(value);
  if (!row) throw new Error("El pedido enviado no es válido.");
  const clientId = text(row.clientId, 100, true);
  if (!clientId) throw new Error("Seleccioná un cliente existente y activo.");
  const client = clients.find((candidate) => candidate.id === clientId && (candidate.status === "Activo" || existing?.clientId === candidate.id));
  if (!client) throw new Error("Seleccioná un cliente existente y activo.");
  if (existing && clientId !== existing.clientId) throw new Error("No se puede reasignar un pedido existente a otra cuenta.");
  const date = text(row.date, 10, true);
  const deliveryDate = text(row.deliveryDate, 10);
  const observations = text(row.observations, 2000);
  const employeeId = text(row.employeeId ?? "", 100);
  const deliveryAddressType = row.deliveryAddressType;
  const customAddress = text(row.customDeliveryAddress ?? "", 200);
  if (!date || !validDate(date) || deliveryDate === null || (deliveryDate && !validDate(deliveryDate)) || observations === null || !employeeId || !SAMPLE_EMPLOYEES.some((employee) => employee.id === employeeId && employee.status === "Activo") || (deliveryAddressType !== "client" && deliveryAddressType !== "custom") || customAddress === null || (deliveryAddressType === "custom" && !customAddress)) throw new Error("Revisá el vendedor, las fechas, la dirección y las observaciones del pedido.");
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
  return { id: existing?.id ?? `o-${crypto.randomUUID()}`, number: existing?.number ?? "", clientId, employeeId: employeeId || undefined, date, deliveryDate: deliveryDate || "", deliveryAddressType, customDeliveryAddress: deliveryAddressType === "custom" ? customAddress : undefined, items, subtotal, discount: discount as number, total: subtotal - (discount as number), status, observations };
}

async function findClient(id: string) {
  const users = await getUsers();
  const clients = users.map(customerAsClient).filter((client): client is Client => client !== null);
  const localData = await serialize(readSalesData);
  return { clients: [...clients, ...localData.clients] };
}

async function persistOrder(order: Order, previous?: Order) {
  const userId = order.clientId.startsWith("customer-") ? order.clientId.slice("customer-".length) : null;
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
  const order = validateOrder({ ...normalizedInput, status: previous?.status ?? normalizedInput?.status }, clients, previous);
  if (!id) order.number = `PC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  else order.number = previous!.number;
  if (previous && (previous.status === "Cancelado" || previous.status === "Facturado")) throw new Error("No se pueden editar pedidos cancelados o facturados.");
  await persistOrder(order, previous);
}

export async function changeSalesOrderStatus(id: string, status: unknown) {
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
