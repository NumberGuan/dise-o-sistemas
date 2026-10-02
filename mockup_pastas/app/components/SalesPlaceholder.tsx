import { Link } from "react-router";

import { SalesPageHeader } from "~/components/SalesLayout";

type SalesPlaceholderProps = { title: string; description: string };

export function SalesPlaceholder({ title, description }: SalesPlaceholderProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SalesPageHeader title={title} description={description} />
      <section className="mt-7 rounded-xl border border-dashed border-gray-300 bg-white p-6 sm:p-8">
        <h2 className="font-semibold text-gray-900">Módulo en preparación</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Esta pantalla se completará en una próxima fase. La navegación y el acceso al resto de Ventas ya están disponibles.</p>
        <Link to="/ventas" className="mt-5 inline-flex rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">Volver a Ventas</Link>
      </section>
    </div>
  );
}
