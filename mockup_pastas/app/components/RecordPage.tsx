import BackToListButton from "~/components/BackToListButton";
import type { ReactNode } from "react";

export default function RecordPage({ onBack, children }: { onBack: () => void; children: ReactNode }) {
  return <div className="mx-auto max-w-6xl px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
    <BackToListButton onClick={onBack} />
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">{children}</section>
  </div>;
}

export function RecordNotFound({ onBack }: { onBack: () => void }) {
  return <RecordPage onBack={onBack}><div className="p-6"><h1 className="text-2xl font-bold">Registro no encontrado</h1><p className="mt-2 text-gray-600">El registro solicitado no está disponible.</p></div></RecordPage>;
}
