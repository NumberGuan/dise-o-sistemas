import { Link } from "react-router";
import { PURCHASE_DOCUMENTS, type PurchaseDocumentKind } from "~/data/purchase-registration";

export default function NewPurchaseDocumentButton({ kind }: { kind: PurchaseDocumentKind }) {
  return <div className="mb-6 flex justify-end">
    <Link to={`/compras/${PURCHASE_DOCUMENTS[kind].path}/nuevo`} className="inline-flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800">
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4" /></svg>
      Subir {kind === "recibo" ? "recibo de pago" : kind}
    </Link>
  </div>;
}
