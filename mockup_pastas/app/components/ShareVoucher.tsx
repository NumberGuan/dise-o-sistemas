import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { generateVoucherPdf } from "~/utils/voucher-pdf.client";

type Props = { printId: string; title: string; number: string; onClose: () => void };

export default function ShareVoucher({ printId, title, number, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const [file, setFile] = useState<File>();
  const [url, setUrl] = useState<string>();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sharing, setSharing] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => { dialog.current?.showModal(); }, []);
  useEffect(() => {
    let cancelled = false;
    setError("");
    const source = document.getElementById(printId);
    if (!source) { setError("No se encontró el comprobante. Cerrá esta ventana y volvé a intentarlo."); return; }
    generateVoucherPdf(source, title, number).then(result => {
      if (!cancelled) setFile(result);
    }).catch(() => {
      if (!cancelled) setError("No pudimos generar el PDF. Volvé a intentarlo.");
    });
    return () => { cancelled = true; };
  }, [printId, title, number, attempt]);
  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const canShare = Boolean(file && typeof navigator.share === "function" && navigator.canShare?.({ files: [file] }));
  async function share() {
    if (!file || sharing) return;
    setSharing(true);
    setMessage("");
    try {
      // A separate click after PDF generation preserves user activation on
      // devices that expire it while the document is being rendered.
      await navigator.share({ files: [file], title: `${title} ${number}` });
      setMessage("Comprobante entregado a la aplicación seleccionada.");
    } catch (cause) {
      if (!((cause instanceof DOMException || cause instanceof Error) && cause.name === "AbortError")) {
        setMessage("No se pudo abrir el menú para compartir. Podés descargar el PDF y adjuntarlo en la aplicación que prefieras.");
      }
    } finally { setSharing(false); }
  }

  return createPortal(<dialog ref={dialog} aria-labelledby={headingId} className="share-voucher-dialog" onCancel={onClose} onClose={onClose}>
    <div className="flex items-start justify-between gap-4">
      <div><h2 id={headingId} className="text-lg font-bold">Compartir comprobante</h2><p className="mt-1 text-sm text-gray-600">{title} · {number}</p></div>
      <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg px-3 py-2 hover:bg-gray-100">✕</button>
    </div>
    <div className="mt-5 space-y-4 text-sm">
      {!file && !error && <p role="status">Generando PDF del comprobante…</p>}
      {error && <><p role="alert" className="text-red-700">{error}</p><button type="button" onClick={() => setAttempt(value => value + 1)} className="rounded-lg border px-4 py-2 font-semibold">Reintentar</button></>}
      {file && <>
        <p>El PDF contiene la misma información y el mismo diseño del comprobante para imprimir.</p>
        <p className="break-all text-gray-600">{file.name}</p>
        <p>{canShare ? "Elegí una aplicación del dispositivo, como WhatsApp o correo, en el menú para compartir." : "Este navegador no permite compartir archivos directamente. Descargá el PDF y adjuntalo en WhatsApp, un correo u otra aplicación."}</p>
        <div className="flex flex-wrap gap-3">
          {canShare && <button type="button" disabled={sharing} onClick={share} className="rounded-lg bg-amber-600 px-4 py-2.5 font-semibold text-white hover:bg-amber-700 disabled:opacity-50">{sharing ? "Compartiendo…" : "Elegir aplicación"}</button>}
          {url && <a href={url} download={file.name} className="rounded-lg border border-amber-600 px-4 py-2.5 font-semibold text-amber-800 hover:bg-amber-50">Descargar PDF</a>}
        </div>
      </>}
      {message && <p role="status">{message}</p>}
    </div>
  </dialog>, document.body);
}
