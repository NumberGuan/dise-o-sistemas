import { data } from "react-router";
import type { Route } from "./+types/comprobante-adjunto";
import { requireUserAndRole } from "~/utils/session.server";
import { readPurchaseAttachment, savePurchaseAttachment } from "~/data/purchase-attachments.server";
import { MAX_ATTACHMENT_SIZE, type PurchaseAttachmentResult } from "~/data/purchase-attachments";

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireUserAndRole(request, ["Administrador"]);
  const stored = await readPurchaseAttachment(params.kind, params.id);
  if (new URL(request.url).searchParams.has("download")) {
    if (!stored) throw new Response("No hay un archivo adjunto.", { status: 404 });
    return new Response(Buffer.from(stored.content, "base64"), { headers: {
      "Content-Type": stored.type,
      "Content-Disposition": `attachment; filename="comprobante"; filename*=UTF-8''${encodeURIComponent(stored.name)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    } });
  }
  return { attachment: stored ? { name: stored.name, size: stored.size, type: stored.type } : null } satisfies PurchaseAttachmentResult;
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireUserAndRole(request, ["Administrador"]);
  if (request.method !== "POST") throw new Response("Método no permitido.", { status: 405 });
  try {
    if (Number(request.headers.get("Content-Length")) > MAX_ATTACHMENT_SIZE + 64 * 1024) throw new Error("El archivo debe pesar hasta 10 MB.");
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("Seleccioná el comprobante del proveedor.");
    const attachment = await savePurchaseAttachment(params.kind, params.id, file);
    return { attachment, message: "Comprobante guardado correctamente." } satisfies PurchaseAttachmentResult;
  } catch (error) {
    if (error instanceof Response) throw error;
    return data({ attachment: null, error: error instanceof Error ? error.message : "No se pudo guardar el comprobante. Intentá nuevamente." } satisfies PurchaseAttachmentResult, { status: 400 });
  }
}
