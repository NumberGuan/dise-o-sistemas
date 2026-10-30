import BackToListButton from "~/components/BackToListButton";
import { Outlet } from "react-router";
import { useId } from "react";

export function SalesLayout() {
  return <Outlet />;
}

type SalesPageHeaderProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function SalesPageHeader({ title, description, action }: SalesPageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-amber-700">Ventas</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">{description}</p>
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </header>
  );
}

export function SalesFormHeader({ title, onCancel, pending = false, action }: { title: string; onCancel: () => void; pending?: boolean; action?: React.ReactNode }) {
  return (
    <div className="sticky top-16 z-30 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 py-3">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <div className="flex flex-wrap items-center gap-2"><BackToListButton onClick={onCancel} disabled={pending} />{action}</div>
    </div>
  );
}

export function SalesListPanel({ title, summary, filters, children }: { title: string; summary: string; filters: React.ReactNode; children: React.ReactNode }) {
  const titleId = useId();
  return <section aria-labelledby={titleId} className="mt-7 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
    <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
      <div><h2 id={titleId} className="font-semibold text-gray-900">{title}</h2><p className="mt-1 text-sm text-gray-500" role="status">{summary}</p></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:flex">{filters}</div>
    </div>
    {children}
  </section>;
}

export function SalesEmptyState({ entity, onReset }: { entity: string; onReset: () => void }) {
  return <div className="px-5 py-14 text-center">
    <div aria-hidden="true" className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500">⌕</div>
    <h3 className="mt-4 font-semibold text-gray-900">No encontramos {entity}</h3>
    <p className="mt-1 text-sm text-gray-500">Probá con otro término o cambiá los filtros.</p>
    <button type="button" onClick={onReset} className="mt-4 rounded-lg px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-600">Limpiar filtros</button>
  </div>;
}
