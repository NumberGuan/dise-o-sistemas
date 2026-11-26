import FormalPageHeader from "~/components/FormalPageHeader";
import BackToListButton from "~/components/BackToListButton";
import type { ReactNode } from "react";

export default function RecordPage({ onBack, children, isNew = false }: { onBack: () => void; children: ReactNode; isNew?: boolean }) {
  return <div className="record-page mx-auto max-w-6xl px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
    <div className="mb-3 flex justify-end">
      <BackToListButton onClick={onBack} />
    </div>
    <section className={isNew ? "form-sheet create-form" : "form-sheet"}>{children}</section>
  </div>;
}

export function RecordNotFound({ onBack }: { onBack: () => void }) {
  return <RecordPage onBack={onBack}><FormalPageHeader><h1 className="text-2xl font-bold">Registro no encontrado</h1><p className="mt-2 text-gray-600">El registro solicitado no está disponible.</p></FormalPageHeader></RecordPage>;
}
