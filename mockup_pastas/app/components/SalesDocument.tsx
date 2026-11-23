import type { ComponentProps, ReactNode } from "react";
import BackToListButton from "./BackToListButton";
import PrintVoucher from "./PrintVoucher";

type Props = ComponentProps<typeof PrintVoucher> & {
  onClose: () => void;
  backLabel?: string;
  actions?: ReactNode;
  notice?: string;
  moduleLabel?: string;
};

export default function SalesDocument({ onClose, backLabel, actions, notice, moduleLabel = "Ventas", ...voucher }: Props) {
  return <div className="mx-auto max-w-5xl px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-medium text-gray-500">{moduleLabel} / {voucher.title}</p>
      <BackToListButton onClick={onClose} label={backLabel} />
    </div>
    {notice && <p role="status" className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{notice}</p>}
    <PrintVoucher {...voucher} preview />
    {actions && <div className="sales-document-actions" aria-label="Acciones del comprobante">{actions}</div>}
  </div>;
}
