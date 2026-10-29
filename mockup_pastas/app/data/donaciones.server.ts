import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { PRODUCTOS_PRODUCCION } from "./produccion";
import { getSalesData } from "./sales.server";
import { currentSalesDate } from "./billing";
import { COUNTER_CLIENT } from "./sales";
import { canDonateProduct, donationAvailability, validDonationDate, type Donation, type DonationItem } from "./donaciones";
import type { Role } from "~/utils/db.server";

const file = path.join(process.cwd(), "data", "donaciones.json");
let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = queue.then(operation, operation);
  queue = result.catch(() => undefined);
  return result;
}

async function read(): Promise<Donation[]> {
  try {
    const rows: unknown = JSON.parse(await fs.readFile(file, "utf8"));
    if (!Array.isArray(rows) || rows.some(row => !row || typeof row.id !== "string" || typeof row.number !== "string" || typeof row.clientName !== "string" || !validDonationDate(row.date) || row.total !== 0 || !Array.isArray(row.items) || row.items.some((item: DonationItem) => !item || !Number.isInteger(item.productId) || !Number.isFinite(item.quantity) || item.quantity <= 0 || !validDonationDate(item.expirationDate) || item.unitPrice !== 0 || item.subtotal !== 0))) {
      throw new Error("Formato inválido");
    }
    return rows;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw new Error("No se pudo leer el registro de donaciones. Se conservó el archivo existente.");
  }
}

async function write(rows: Donation[]) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, JSON.stringify(rows, null, 2), { flag: "wx" });
    await fs.rename(temporary, file);
  } finally {
    await fs.rm(temporary, { force: true });
  }
}

export function getDonations() { return serialize(read); }

export async function saveDonation(input: unknown, role: Role) {
  if (role !== "Administrador" && role !== "Ventas") throw new Error("No tenés permiso para registrar donaciones.");
  const { clients } = await getSalesData();
  return serialize(async () => {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("La donación no es válida.");
    const row = input as Record<string, unknown>;
    const client = clients.find(candidate => candidate.id === row.clientId && candidate.status === "Activo" && candidate.id !== COUNTER_CLIENT.id);
    if (!client) throw new Error("Seleccioná un cliente activo que recibirá la donación.");
    if (!validDonationDate(row.date) || row.date > currentSalesDate()) throw new Error("Ingresá una fecha de donación válida, hasta el día de hoy.");
    const date = row.date;
    if (typeof row.observations !== "string" || row.observations.length > 2000) throw new Error("Las observaciones pueden tener hasta 2000 caracteres.");
    if (!Array.isArray(row.items) || !row.items.length || row.items.length > 100) throw new Error("Agregá al menos un producto a la donación (máximo 100).");
    const donations = await read();
    const seen = new Set<number>();
    const items: DonationItem[] = row.items.map(raw => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("El detalle de productos no es válido.");
      const product = PRODUCTOS_PRODUCCION.find(candidate => candidate.idProducto === raw.productId);
      if (!product || !canDonateProduct(product, date)) throw new Error("Solo se pueden donar productos con stock que venzan dentro de los próximos 7 días de la fecha de donación.");
      if (seen.has(product.idProducto)) throw new Error("Hay productos repetidos en la donación.");
      seen.add(product.idProducto);
      const quantity = raw.quantity;
      if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0 || Math.abs(quantity * 1000 - Math.round(quantity * 1000)) > 0.000001) throw new Error("Ingresá cantidades mayores que cero, con hasta 3 decimales.");
      if (quantity > donationAvailability(product, donations)) throw new Error(`La cantidad de ${product.nombre} supera las existencias disponibles para donar.`);
      return { productId: product.idProducto, productName: product.nombre, unitId: product.idUnidad, expirationDate: product.fechaVencimiento, quantity, unitPrice: 0, subtotal: 0 };
    });
    const next = Math.max(0, ...donations.map(donation => Number(donation.number.slice(4)) || 0)) + 1;
    const donation: Donation = { id: crypto.randomUUID(), number: `DON-${String(next).padStart(6, "0")}`, clientId: client.id, clientName: client.name, date, items, total: 0, observations: row.observations.trim() };
    await write([donation, ...donations]);
    return donation;
  });
}
