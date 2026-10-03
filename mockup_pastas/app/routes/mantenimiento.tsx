import { Link, NavLink, Outlet, useLocation } from "react-router";
import { SAMPLE_MACHINES, SAMPLE_MAINTENANCES } from "~/data/maintenance";

const pages = [
  { label: "Máquinas", to: "/mantenimiento/maquinas" },
  { label: "Mantenimiento de Máquinas", to: "/mantenimiento/mantenimientos" },
] as const;

function Dashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const finished = SAMPLE_MAINTENANCES.filter((item) => item.status === "Finalizado").slice(-3).reverse();
  const cards = [
    ["Total de máquinas", SAMPLE_MACHINES.length],
    ["Máquinas activas", SAMPLE_MACHINES.filter((m) => m.status === "Activa").length],
    ["En mantenimiento", SAMPLE_MACHINES.filter((m) => m.status === "En mantenimiento").length],
    ["Fuera de servicio o inactivas", SAMPLE_MACHINES.filter((m) => m.status === "Fuera de servicio" || m.status === "Inactiva").length],
    ["Mantenimientos programados", SAMPLE_MAINTENANCES.filter((m) => m.status === "Programado").length],
    ["Mantenimientos vencidos", SAMPLE_MAINTENANCES.filter((m) => m.status === "Programado" && m.scheduledDate < today).length],
    ["Mantenimientos en curso", SAMPLE_MAINTENANCES.filter((m) => m.status === "En curso").length],
  ] as const;
  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <p className="text-sm font-medium text-amber-700">Mantenimiento</p><h1 className="mt-1 text-2xl font-bold text-gray-900">Mantenimiento</h1>
    <p className="mt-2 text-sm text-gray-500">Administración de máquinas y seguimiento de sus intervenciones.</p>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value]) => <article key={label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-3xl font-bold text-gray-900">{value}</p></article>)}</div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2"><Link className="rounded-xl border border-amber-200 bg-amber-50 p-5 font-semibold text-amber-800 hover:bg-amber-100" to="/mantenimiento/maquinas">Gestionar máquinas →</Link><Link className="rounded-xl border border-sky-200 bg-sky-50 p-5 font-semibold text-sky-800 hover:bg-sky-100" to="/mantenimiento/mantenimientos">Gestionar mantenimientos →</Link></div>
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-gray-900">Últimos mantenimientos finalizados</h2>{finished.length ? <ul className="mt-3 divide-y divide-gray-100">{finished.map((item) => <li key={item.id} className="flex justify-between py-3 text-sm"><span>{item.number} · {SAMPLE_MACHINES.find((m) => m.id === item.machineId)?.name}</span><span className="text-gray-500">{item.endDate}</span></li>)}</ul> : <p className="mt-3 text-sm text-gray-500">Todavía no hay mantenimientos finalizados.</p>}</section>
  </div>;
}

export default function Mantenimiento() {
  const location = useLocation();
  const root = location.pathname === "/mantenimiento" || location.pathname === "/mantenimiento/";
  return <><nav className="border-b border-gray-200 bg-white" aria-label="Navegación de Mantenimiento"><div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">{pages.map((page) => <NavLink key={page.to} to={page.to} end className={({isActive}) => `shrink-0 border-b-2 px-3 py-3 text-sm ${isActive ? "border-amber-600 font-semibold text-amber-800" : "border-transparent text-gray-500 hover:text-gray-800"}`}>{page.label}</NavLink>)}</div></nav>{root ? <Dashboard /> : <div className="text-gray-900"><Outlet /></div>}</>;
}
