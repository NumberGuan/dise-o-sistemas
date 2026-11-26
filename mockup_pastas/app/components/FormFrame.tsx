import FormalPageHeader from "~/components/FormalPageHeader";
import type { ReactNode } from "react";

export default function FormFrame({ module, title, description, actions, children, isNew = false }: {
  module: string;
  title: string;
  description?: string;
  actions: ReactNode;
  children?: ReactNode;
  isNew?: boolean;
}) {
  return <>
    <div className="mb-3 flex flex-wrap justify-end gap-2">{actions}</div>
    <section className={isNew ? "form-sheet create-form" : "form-sheet"}>
      <FormalPageHeader>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-600">{module}</p>
        <h1>{title}</h1>
        {description && <p className="mt-2 text-sm text-gray-600">{description}</p>}
      </FormalPageHeader>
      {children && <div className="form-sheet-body">{children}</div>}
    </section>
  </>;
}
