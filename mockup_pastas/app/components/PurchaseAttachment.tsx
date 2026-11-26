import { useEffect, useId, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { ATTACHMENT_ACCEPT, MAX_ATTACHMENT_SIZE, type PurchaseAttachmentResult } from "~/data/purchase-attachments";

export default function PurchaseAttachment({ kind, documentId, compact = false }: { kind: string; documentId: number; compact?: boolean }) {
  const fetcher = useFetcher<PurchaseAttachmentResult>();
  const input = useRef<HTMLInputElement>(null);
  const descriptionId = useId();
  const [error, setError] = useState("");
  const [attachment, setAttachment] = useState<PurchaseAttachmentResult["attachment"]>(null);
  const url = `/compras/comprobante-adjunto/${kind}/${documentId}`;
  const { load } = fetcher;
  useEffect(() => { load(url); }, [load, url]);
  useEffect(() => {
    if (fetcher.data && !fetcher.data.error) setAttachment(fetcher.data.attachment);
  }, [fetcher.data]);
  const busy = fetcher.state !== "idle";

  return <section className={compact ? "mt-2 print:hidden" : "mt-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm print:hidden"} aria-label="Comprobante del proveedor">
    {!compact && <h2 className="font-semibold text-gray-900">Comprobante del proveedor</h2>}
    <p id={descriptionId} className={compact ? "sr-only" : "mt-1 text-sm text-gray-500"}>Adjuntá el archivo recibido del proveedor. PDF, JPG, PNG o WebP, hasta 10 MB.</p>
    <div className={compact ? "flex flex-col items-end gap-2" : "mt-4 flex flex-wrap items-center gap-3"}>
      <input ref={input} type="file" accept={ATTACHMENT_ACCEPT} className="hidden" aria-label="Archivo del comprobante" aria-describedby={descriptionId} disabled={busy}
        onChange={event => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (!file) return;
          setError("");
          if (file.size > MAX_ATTACHMENT_SIZE) { setError("El archivo debe pesar hasta 10 MB."); return; }
          if (!file.size) { setError("Seleccioná un archivo con contenido."); return; }
          const form = new FormData();
          form.set("file", file);
          fetcher.submit(form, { method: "post", action: url, encType: "multipart/form-data" });
        }} />
      <button type="button" disabled={busy} onClick={() => { setError(""); input.current?.click(); }}
        aria-describedby={descriptionId}
        className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-amber-300 bg-amber-50 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:cursor-wait disabled:opacity-60 ${compact ? "px-3 py-1.5" : "px-4 py-2"}`}>
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4" /></svg>
        {busy ? (fetcher.state === "submitting" ? "Subiendo comprobante…" : "Cargando…") : attachment ? "Reemplazar comprobante" : "Subir comprobante"}
      </button>
      {attachment && <a href={`${url}?download=1`} className="break-all text-sm font-medium text-amber-800 underline">Descargar {attachment.name}</a>}
    </div>
    {(error || fetcher.data?.error) ? <p role="alert" className="mt-3 text-sm text-rose-700">{error || fetcher.data?.error}</p> :
      (!compact || fetcher.data?.message) && <p role="status" className="mt-3 text-sm text-gray-600">{fetcher.data?.message ?? (attachment ? "Archivo adjunto guardado." : busy ? "Cargando archivo adjunto…" : "Todavía no se adjuntó un comprobante.")}</p>}
  </section>;
}
