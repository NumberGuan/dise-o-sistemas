import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { purchasesFixtures } from "./compras-fixtures.server";
import type { PurchaseAttachment } from "./purchase-attachments";
import { preparePurchaseAttachment, type StoredAttachment } from "./purchase-attachment-file.server";
import { readPurchaseRegistrations } from "./purchase-registration.server";

const documents = {
  presupuesto: purchasesFixtures.PRESUPUESTOS_PROVEEDOR,
  factura: purchasesFixtures.COMPROBANTES_VENTA_PROVEEDOR,
  recibo: purchasesFixtures.RECIBOS_PAGO_PROVEEDOR,
  remito: purchasesFixtures.REMITOS,
};


async function attachmentPath(kind: string, id: string) {
  if (!Object.hasOwn(documents, kind) || !/^[1-9]\d*$/.test(id) ||
    (!documents[kind as keyof typeof documents].some(document => document.id === Number(id)) &&
      !(await readPurchaseRegistrations()).some(row => row.kind === kind && row.record.id === Number(id)))) {
    throw new Response("Comprobante no encontrado.", { status: 404 });
  }
  return path.join(process.cwd(), "data", "purchase-attachments", `${kind}-${id}.json`);
}

export async function readPurchaseAttachment(kind: string, id: string): Promise<StoredAttachment | null> {
  const target = await attachmentPath(kind, id);
  try {
    return JSON.parse(await fs.readFile(target, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return (await readPurchaseRegistrations()).find(row => row.kind === kind && row.record.id === Number(id))?.attachment ?? null;
    throw new Error("No se pudo leer el comprobante adjunto. Intentá nuevamente.");
  }
}

export async function savePurchaseAttachment(kind: string, id: string, file: File): Promise<PurchaseAttachment> {
  const target = await attachmentPath(kind, id);
  const stored = await preparePurchaseAttachment(file);
  const { content, ...attachment } = stored;
  await fs.mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, JSON.stringify(stored));
    await fs.rename(temporary, target);
  } finally {
    await fs.rm(temporary, { force: true });
  }
  return attachment;
}

