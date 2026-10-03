import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { SAMPLE_EMPLOYEES } from "~/data/employees";
import { MAINTENANCE_STATUSES, MAINTENANCE_TYPES, SAMPLE_MACHINES, SAMPLE_MAINTENANCES, type MachineMaintenance, type MaintenanceStatus, type MaintenanceType } from "~/data/maintenance";

const field = "mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100";
const labelClass = "block text-sm font-medium text-gray-700";
const badge = (s: MaintenanceStatus) => s === "Programado" ? "bg-amber-100 text-amber-800" : s === "En curso" ? "bg-sky-100 text-sky-800" : s === "Finalizado" ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700";
const nextNumber = () => `MAN-${String(Math.max(0, ...SAMPLE_MAINTENANCES.map((m) => Number(m.number.match(/\d+$/)?.[0]) || 0)) + 1).padStart(4, "0")}`;

function MaintenanceForm({ item, preselected, onCancel, onSave }: { item: MachineMaintenance | null; preselected?: string; onCancel: () => void; onSave: (m: MachineMaintenance, start: boolean) => void }) {
  const [number] = useState(item?.number ?? nextNumber());
  const [machineId, setMachine] = useState(item?.machineId ?? preselected ?? "");
  const [type, setType] = useState<MaintenanceType | "">(item?.type ?? "");
  const [date, setDate] = useState(item?.scheduledDate ?? new Date().toISOString().slice(0, 10));
  const [employee, setEmployee] = useState(item?.responsibleEmployeeId ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [observations, setObservations] = useState(item?.observations ?? "");
  const [error, setError] = useState("");

  function submit(e: FormEvent, start: boolean) {
    e.preventDefault();
    const machine = SAMPLE_MACHINES.find((m) => m.id === machineId);
    if (!machine || machine.status === "Inactiva") return setError("Seleccioná una máquina disponible.");
    if (!type) return setError("Seleccioná el tipo de mantenimiento.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError("Ingresá una fecha válida.");
    if (!employee) return setError("Seleccioná un responsable activo.");
    if (!description.trim()) return setError("Ingresá la tarea o problema a atender.");
    if (SAMPLE_MAINTENANCES.some((m) => m.id !== item?.id && m.machineId === machineId && m.type === type && m.scheduledDate === date && m.status !== "Cancelado")) return setError("Ya existe un mantenimiento equivalente para esa fecha.");
    if (start && SAMPLE_MAINTENANCES.some((m) => m.id !== item?.id && m.machineId === machineId && m.status === "En curso")) return setError("La máquina ya tiene un mantenimiento en curso.");
    onSave({ id: item?.id ?? `mant-${Date.now()}`, number, machineId, type, scheduledDate: date, responsibleEmployeeId: employee, description: description.trim(), workPerformed: item?.workPerformed ?? "", status: item?.status ?? "Programado", observations: observations.trim(), startDate: item?.startDate, endDate: item?.endDate, previousMachineStatus: item?.previousMachineStatus }, start);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/40 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section role="dialog" aria-modal="true" className="max-h-[95vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-2xl sm:rounded-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{item ? "Editar mantenimiento" : "Nuevo mantenimiento"}</h2>
            <p className="mt-1 text-sm text-gray-500">Los cambios quedan disponibles durante esta sesión.</p>
          </div>
          <button type="button" onClick={onCancel} aria-label="Cerrar formulario" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-amber-600">✕</button>
        </div>
        <form className="space-y-5 p-5 sm:p-6" onSubmit={(e) => submit(e, false)}>
          {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Número
              <input value={number} readOnly className={`${field} bg-gray-100`} />
            </label>
            <label className={labelClass}>Máquina <span className="text-rose-600">*</span>
              <select value={machineId} onChange={(e) => setMachine(e.target.value)} className={field}>
                <option value="">Seleccionar...</option>
                {SAMPLE_MACHINES.filter((m) => m.status !== "Inactiva").map((m) => <option key={m.id} value={m.id}>{m.code} · {m.name}</option>)}
              </select>
            </label>
            <label className={labelClass}>Tipo <span className="text-rose-600">*</span>
              <select value={type} onChange={(e) => setType(e.target.value as MaintenanceType)} className={field}>
                <option value="">Seleccionar...</option>
                {MAINTENANCE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className={labelClass}>Fecha programada <span className="text-rose-600">*</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
            </label>
            <label className={labelClass}>Responsable <span className="text-rose-600">*</span>
              <select value={employee} onChange={(e) => setEmployee(e.target.value)} className={field}>
                <option value="">Seleccionar...</option>
                {SAMPLE_EMPLOYEES.filter((x) => x.status === "Activo").map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </label>
            <label className={`${labelClass} sm:col-span-2`}>Descripción <span className="text-rose-600">*</span>
              <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>Observaciones
              <textarea rows={3} value={observations} onChange={(e) => setObservations(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
            </label>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-amber-600">Cancelar</button>
            <button type="submit" className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-amber-600">Guardar Programado</button>
            <button type="button" onClick={(e) => submit(e as unknown as FormEvent, true)} className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700">Guardar e Iniciar</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function MaintenanceDetails({ maintenance, onClose, onEdit, onTransition, machine }: { maintenance: MachineMaintenance; onClose: () => void; onEdit: () => void; onTransition: (next: MaintenanceStatus, work: string, endDate: string) => { error?: string } | void; machine: typeof SAMPLE_MACHINES[0] | undefined }) {
  const employee = SAMPLE_EMPLOYEES.find((e) => e.id === maintenance.responsibleEmployeeId);
  const [work, setWork] = useState("");
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");

  const handleTransition = (next: MaintenanceStatus) => {
    const res = onTransition(next, work, endDate);
    if (res?.error) setError(res.error);
    else setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/40 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" className="max-h-[95vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-3xl sm:rounded-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{maintenance.number} · {maintenance.type}</p>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-xl font-bold text-gray-900">{machine?.name ?? "Máquina desconocida"}</h2>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badge(maintenance.status)}`}>{maintenance.status}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {maintenance.status === "Programado" && <button type="button" onClick={onEdit} className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700">Editar</button>}
            <button type="button" onClick={onClose} aria-label="Cerrar detalle" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Cerrar</button>
          </div>
        </div>
        <div className="grid gap-7 p-5 sm:grid-cols-[minmax(0,1fr)_1.2fr] sm:p-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Información del mantenimiento</h3>
            <dl className="mt-3 space-y-3 text-sm">
              {[
                ["Máquina", machine?.name ?? "—"],
                ["Tipo", maintenance.type],
                ["Fecha programada", maintenance.scheduledDate],
                ["Responsable", employee?.name ?? "—"],
                ["Fecha de inicio", maintenance.startDate ?? "—"],
                ["Fecha de finalización", maintenance.endDate ?? "—"],
                ["Descripción", maintenance.description],
                ["Trabajo realizado", maintenance.workPerformed || "—"]
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-gray-500">{label}</dt>
                  <dd className="mt-0.5 break-words font-medium text-gray-800">{value}</dd>
                </div>
              ))}
            </dl>
            {maintenance.observations && (
              <div className="mt-4 rounded-lg bg-amber-50 p-3">
                <p className="text-xs font-semibold text-amber-900">Observaciones</p>
                <p className="mt-1 text-sm text-amber-900">{maintenance.observations}</p>
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col gap-2">
               <Link to={`/mantenimiento/maquinas?maquina=${maintenance.machineId}`} className="text-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                 Ver ficha de máquina
               </Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Acciones de estado</h3>
            <p className="mt-1 text-xs text-gray-500">Avanza el estado del mantenimiento actual.</p>
            
            {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            
            {maintenance.status === "Programado" && (
               <div className="mt-4 flex flex-col gap-3">
                 <button onClick={() => handleTransition("En curso")} className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700">Iniciar mantenimiento</button>
                 <button onClick={() => handleTransition("Cancelado")} className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50">Cancelar mantenimiento</button>
               </div>
            )}
            
            {maintenance.status === "En curso" && (
               <div className="mt-4 space-y-4">
                 <div>
                   <label className={labelClass}>Trabajo realizado <span className="text-rose-600">*</span>
                     <textarea value={work} onChange={(e) => setWork(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
                   </label>
                 </div>
                 <div>
                   <label className={labelClass}>Fecha de finalización <span className="text-rose-600">*</span>
                     <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={field} />
                   </label>
                 </div>
                 <button onClick={() => handleTransition("Finalizado")} className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">Finalizar mantenimiento</button>
               </div>
            )}
            
            {(maintenance.status === "Finalizado" || maintenance.status === "Cancelado") && (
               <div className="mt-4 rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
                 Este mantenimiento ya se encuentra {maintenance.status.toLowerCase()} y no admite más cambios de estado.
               </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Mantenimientos() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState(() => [...SAMPLE_MAINTENANCES]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [type, setType] = useState("Todos");
  const [machineFilter, setMachineFilter] = useState("Todas");
  const [editing, setEditing] = useState<MachineMaintenance | null | undefined>();
  const [selected, setSelected] = useState<MachineMaintenance | null>(null);

  useEffect(() => {
    const id = params.get("mantenimiento");
    if (id) setSelected(SAMPLE_MAINTENANCES.find((m) => m.id === id) ?? null);
    else if (params.get("maquina")) setEditing(null);
  }, [params]);

  useEffect(() => {
    if (editing === undefined && selected === null) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") { setEditing(undefined); setSelected(null); }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editing, selected]);

  const filtered = useMemo(() => items.filter((m) => {
    const machine = SAMPLE_MACHINES.find((x) => x.id === m.machineId);
    const q = search.toLowerCase();
    return (!q || m.number.toLowerCase().includes(q) || machine?.name.toLowerCase().includes(q)) &&
      (status === "Todos" || m.status === status) &&
      (type === "Todos" || m.type === type) &&
      (machineFilter === "Todas" || m.machineId === machineFilter);
  }), [items, search, status, type, machineFilter]);

  function sync() { setItems([...SAMPLE_MAINTENANCES]); }
  function machine(id: string) { return SAMPLE_MACHINES.find((m) => m.id === id); }

  function save(item: MachineMaintenance, start: boolean) {
    const i = SAMPLE_MAINTENANCES.findIndex((m) => m.id === item.id);
    if (start) {
      const target = machine(item.machineId);
      if (!target) return;
      item = { ...item, status: "En curso", startDate: new Date().toISOString().slice(0, 10), previousMachineStatus: target.status === "Fuera de servicio" ? "Fuera de servicio" : "Activa" };
      target.status = "En mantenimiento";
    }
    if (i >= 0) SAMPLE_MAINTENANCES[i] = item;
    else SAMPLE_MAINTENANCES.unshift(item);
    sync();
    setEditing(undefined);
    setSelected(item);
    setParams({ mantenimiento: item.id });
  }

  function transition(next: MaintenanceStatus, work: string, endDate: string) {
    if (!selected) return;
    const target = machine(selected.machineId);
    
    if (next === "En curso") {
      if (SAMPLE_MAINTENANCES.some((m) => m.id !== selected.id && m.machineId === selected.machineId && m.status === "En curso")) {
        return { error: "La máquina ya tiene otro mantenimiento en curso." };
      }
      if (!target) return;
      const updated = { ...selected, status: next, startDate: new Date().toISOString().slice(0, 10), previousMachineStatus: target.status === "Fuera de servicio" ? "Fuera de servicio" : "Activa" } as MachineMaintenance;
      target.status = "En mantenimiento";
      save(updated, false);
      return;
    }
    
    if (next === "Finalizado" && (!work.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(endDate))) {
      return { error: "Para finalizar, ingresá el trabajo realizado y una fecha válida." };
    }
    
    const updated = { ...selected, status: next, endDate: next === "Finalizado" ? endDate : selected.endDate, workPerformed: next === "Finalizado" ? work.trim() : selected.workPerformed };
    const i = SAMPLE_MAINTENANCES.findIndex((m) => m.id === selected.id);
    SAMPLE_MAINTENANCES[i] = updated;
    
    if (target && !SAMPLE_MAINTENANCES.some((m) => m.id !== selected.id && m.machineId === selected.machineId && m.status === "En curso") && target.status === "En mantenimiento") {
      target.status = selected.previousMachineStatus ?? "Activa";
    }
    
    sync();
    setSelected(updated);
  }

  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-700">Mantenimiento</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">Mantenimiento de Máquinas</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Registra y consulta las intervenciones de mantenimiento.</p>
        </div>
        <button type="button" onClick={() => setEditing(null)} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">＋ Nuevo Mantenimiento</button>
      </header>

      <section className="mt-7 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Listado de mantenimientos</h2>
            <p className="mt-1 text-sm text-gray-500">{filtered.length} {filtered.length === 1 ? "mantenimiento" : "mantenimientos"} encontrados</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:flex">
            <label className="sr-only" htmlFor="maintenance-search">Buscar mantenimientos</label>
            <input id="maintenance-search" aria-label="Buscar mantenimientos" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar número o máquina..." className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 sm:w-64" />
            <label className="sr-only" htmlFor="maintenance-status">Filtrar por estado</label>
            <select id="maintenance-status" aria-label="Estado" value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100">
              <option>Todos</option>
              {MAINTENANCE_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <label className="sr-only" htmlFor="maintenance-type">Filtrar por tipo</label>
            <select id="maintenance-type" aria-label="Tipo" value={type} onChange={(e) => setType(e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100">
              <option>Todos</option>
              {MAINTENANCE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <label className="sr-only" htmlFor="maintenance-machine">Filtrar por máquina</label>
            <select id="maintenance-machine" aria-label="Máquina" value={machineFilter} onChange={(e) => setMachineFilter(e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100">
              <option>Todas</option>
              {SAMPLE_MACHINES.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div aria-hidden="true" className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500">⌕</div>
            <h3 className="mt-4 font-semibold text-gray-900">No se encontraron mantenimientos</h3>
            <p className="mt-1 text-sm text-gray-500">Prueba con otro término o cambia los filtros.</p>
            <button type="button" onClick={() => { setSearch(""); setStatus("Todos"); setType("Todos"); setMachineFilter("Todas"); }} className="mt-4 text-sm font-semibold text-amber-700 hover:text-amber-800">Limpiar filtros</button>
          </div>
        ) : (
          <>
            <div className="hidden lg:grid lg:grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr_auto] items-center gap-5 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <div className="min-w-0 text-left">Número / Máquina</div>
              <div className="min-w-0 text-center">Tipo</div>
              <div className="min-w-0 text-center">Programado</div>
              <div className="min-w-0 text-center">Responsable</div>
              <div className="min-w-0 text-center">Estado</div>
              <div className="min-w-0 text-center">Acciones</div>
            </div>
            <div className="divide-y divide-gray-100">
              {filtered.map((m) => {
                const due = m.status === "Programado" && m.scheduledDate < today;
                return (
                  <article key={m.id} className="grid min-w-0 grid-cols-2 items-center gap-x-4 gap-y-3 p-4 transition hover:bg-amber-50/30 lg:grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr_auto] lg:gap-5 lg:px-5">
                    <div className="col-span-2 min-w-0 lg:col-span-1 text-left">
                      <p className="mb-1 text-xs font-medium text-gray-500">{m.number}</p>
                      <h3 className="break-words font-semibold leading-5 text-gray-900">{machine(m.machineId)?.name}</h3>
                    </div>
                    <div className="min-w-0 text-left lg:text-center">
                      <p className="text-xs font-medium text-gray-500 lg:hidden">Tipo</p>
                      <p className="mt-1 break-words text-sm text-gray-900 lg:mt-0">{m.type}</p>
                    </div>
                    <div className="min-w-0 text-left lg:text-center">
                      <p className="text-xs font-medium text-gray-500 lg:hidden">Programado</p>
                      <p className="mt-1 break-words text-sm text-gray-900 lg:mt-0">{m.scheduledDate} {due && <span className="text-red-600 font-semibold block sm:inline">· Vencido</span>}</p>
                    </div>
                    <div className="min-w-0 text-left lg:text-center">
                      <p className="text-xs font-medium text-gray-500 lg:hidden">Responsable</p>
                      <p className="mt-1 break-words text-sm text-gray-900 lg:mt-0">{SAMPLE_EMPLOYEES.find((e) => e.id === m.responsibleEmployeeId)?.name || "—"}</p>
                    </div>
                    <div className="flex flex-col items-start gap-1 lg:items-center">
                      <span className="text-xs font-medium text-gray-500 lg:hidden">Estado</span>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badge(m.status)}`}>{m.status}</span>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2 border-t border-gray-100 pt-2 lg:col-span-1 lg:border-0 lg:pt-0 lg:justify-center">
                      <button type="button" onClick={() => { setSelected(m); setParams({ mantenimiento: m.id }); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-600">Consultar</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      {editing !== undefined && <MaintenanceForm item={editing} preselected={params.get("maquina") ?? undefined} onCancel={() => { setEditing(undefined); setParams({}); }} onSave={save} />}
      {selected && <MaintenanceDetails maintenance={selected} machine={machine(selected.machineId)} onClose={() => { setSelected(null); setParams({}); }} onEdit={() => { setEditing(selected); setSelected(null); }} onTransition={transition} />}
    </div>
  );
}
