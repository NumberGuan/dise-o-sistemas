import { MAX_ATTACHMENT_SIZE, type PurchaseAttachment } from "./purchase-attachments";

export type StoredAttachment = PurchaseAttachment & { content: string };

export async function preparePurchaseAttachment(file: File): Promise<StoredAttachment> {
  if (!file.size) throw new Error("Seleccioná un archivo con contenido.");
  if (file.size > MAX_ATTACHMENT_SIZE) throw new Error("El archivo debe pesar hasta 10 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const formats = [
    { extension: /\.pdf$/i, type: "application/pdf", valid: bytes.subarray(0, 5).toString() === "%PDF-" },
    { extension: /\.jpe?g$/i, type: "image/jpeg", valid: bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
    { extension: /\.png$/i, type: "image/png", valid: bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
    { extension: /\.webp$/i, type: "image/webp", valid: bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP" },
  ];
  const format = formats.find(format => format.extension.test(file.name) && format.valid);
  if (!format) throw new Error("Adjuntá un PDF o una imagen JPG, PNG o WebP válida.");
  const attachment: PurchaseAttachment = { name: file.name.replace(/[\\/\x00-\x1f\x7f]/g, "_").slice(-180), size: file.size, type: format.type };
  return { ...attachment, content: bytes.toString("base64") };
}
