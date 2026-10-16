import BackToListButton from "~/components/BackToListButton";
import { Outlet } from "react-router";

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

export function SalesFormHeader({ title, onCancel, pending = false }: { title: string; onCancel: () => void; pending?: boolean }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <BackToListButton onClick={onCancel} disabled={pending} />
    </div>
  );
}
